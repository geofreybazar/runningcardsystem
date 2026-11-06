import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { Role } from '../generated/prisma/enums.js';
import type { AuthUser } from '../auth/auth-user.js';
import type { CreateUserDto, UpdateUserDto } from './users.dto.js';

const PUBLIC_FIELDS = {
  id: true,
  username: true,
  fullName: true,
  role: true,
  districtId: true,
  district: { select: { code: true, name: true } },
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
} as const;

/** Admins manage field accounts; only a Super Admin manages Admins and Super Admins. */
export const canManageRole = (actor: Pick<AuthUser, 'role'>, role: Role) =>
  actor.role === Role.SUPER_ADMIN || (actor.role === Role.ADMIN && (role === Role.OPERATIONS || role === Role.RADIO_OPERATOR));

const tempPassword = () => randomBytes(9).toString('base64url'); // 12 chars

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.user.findMany({ where: { deletedAt: null }, select: PUBLIC_FIELDS, orderBy: { username: 'asc' } });
  }

  async create(actor: AuthUser, dto: CreateUserDto) {
    this.assertCanManage(actor, dto.role);
    const districtId = await this.districtFor(dto.role, dto.districtId);
    if (await this.prisma.user.findUnique({ where: { username: dto.username } })) {
      throw new ConflictException('Username is already taken');
    }
    const password = tempPassword();
    const user = await this.prisma.user.create({
      data: { username: dto.username, fullName: dto.fullName, role: dto.role, districtId, passwordHash: await this.hasher.hash(password), mustChangePassword: true },
      select: PUBLIC_FIELDS,
    });
    await this.audit.log(actor.id, 'CREATE', 'User', user.id, { username: user.username, role: user.role, districtId });
    return { user, temporaryPassword: password };
  }

  async update(actor: AuthUser, id: string, dto: UpdateUserDto) {
    const target = await this.find(id);
    this.assertCanManage(actor, target.role);
    if (id === actor.id && (dto.role !== undefined || dto.isActive === false)) {
      throw new BadRequestException('You cannot change your own role or disable yourself');
    }
    const role = dto.role ?? target.role;
    if (dto.role) this.assertCanManage(actor, dto.role);
    const districtId = await this.districtFor(role, dto.districtId === undefined ? target.districtId : dto.districtId);
    const user = await this.prisma.user.update({
      where: { id },
      data: { fullName: dto.fullName, role, districtId, isActive: dto.isActive },
      select: PUBLIC_FIELDS,
    });
    if (dto.isActive === false) await this.tokens.revokeAll(id);
    await this.audit.log(actor.id, dto.isActive === false ? 'DISABLE' : 'UPDATE', 'User', id, dto);
    return user;
  }

  async resetPassword(actor: AuthUser, id: string) {
    const target = await this.find(id);
    this.assertCanManage(actor, target.role);
    const password = tempPassword();
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await this.hasher.hash(password), mustChangePassword: true },
    });
    await this.tokens.revokeAll(id);
    await this.audit.log(actor.id, 'RESET_PASSWORD', 'User', id);
    return { temporaryPassword: password };
  }

  /** Soft delete: the account disappears and can't sign in, but incident history keeps the name. */
  async remove(actor: AuthUser, id: string) {
    const target = await this.find(id);
    this.assertCanManage(actor, target.role);
    if (id === actor.id) throw new BadRequestException('You cannot remove your own account');
    await this.prisma.user.update({
      where: { id },
      // Free the username for reuse.
      data: { deletedAt: new Date(), isActive: false, username: `${target.username}#deleted-${Date.now()}` },
    });
    await this.tokens.revokeAll(id);
    await this.audit.log(actor.id, 'DELETE', 'User', id, { username: target.username });
  }

  private async find(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private assertCanManage(actor: AuthUser, role: Role) {
    if (!canManageRole(actor, role)) throw new ForbiddenException(`You cannot manage ${role} accounts`);
  }

  // Operations accounts belong to one fire district; everyone else works across NCR.
  private async districtFor(role: Role, districtId: number | null | undefined) {
    if (role !== Role.OPERATIONS) return null;
    if (!districtId || !(await this.prisma.fireDistrict.findUnique({ where: { id: districtId } }))) {
      throw new BadRequestException('Operations accounts need a valid fire district');
    }
    return districtId;
  }
}
