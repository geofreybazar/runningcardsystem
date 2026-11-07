import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { OfficeLevel, Role, type Rank } from '../generated/prisma/enums.js';
import { CityDirectory } from '../geo/city-directory.service.js';
import { OFFICE_LEVELS } from '../auth/area.js';
import type { AuthUser } from '../auth/auth-user.js';
import type { CreateUserDto, UpdateUserDto } from './users.dto.js';

const PUBLIC_FIELDS = {
  id: true,
  accountNumber: true,
  rank: true,
  firstName: true,
  middleName: true,
  lastName: true,
  role: true,
  officeLevel: true,
  districtId: true,
  district: { select: { code: true, name: true, alias: true } },
  cityId: true,
  city: { select: { name: true } },
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
} as const;

/** Admin (regional IT) manages every account except Super Admin (developers). */
export const canManageRole = (actor: Pick<AuthUser, 'role'>, role: Role) =>
  actor.role === Role.SUPER_ADMIN || (actor.role === Role.ADMIN && role !== Role.SUPER_ADMIN);

type OfficeInput = { officeLevel?: OfficeLevel; districtId?: number | null; cityId?: number | null };

/** Super Admin (developers) has no rank; every other account needs one. */
function rankFor(role: Role, rank: Rank | null | undefined): Rank | null {
  if (role === Role.SUPER_ADMIN) return null;
  if (!rank) throw new BadRequestException('rank is required');
  return rank;
}

const tempPassword = () => randomBytes(9).toString('base64url'); // 12 chars

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly cities: CityDirectory,
  ) {}

  list() {
    return this.prisma.user.findMany({ where: { deletedAt: null }, select: PUBLIC_FIELDS, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] });
  }

  async create(actor: AuthUser, dto: CreateUserDto) {
    this.assertCanManage(actor, dto.role);
    const office = await this.office(dto.role, dto);
    const rank = rankFor(dto.role, dto.rank);
    await this.assertAccountNumberFree(dto.accountNumber);
    const password = tempPassword();
    const name = { firstName: dto.firstName, middleName: dto.middleName ?? null, lastName: dto.lastName };
    const user = await this.prisma.user.create({
      data: { accountNumber: dto.accountNumber, rank, ...name, role: dto.role, ...office, passwordHash: await this.hasher.hash(password), mustChangePassword: true },
      select: PUBLIC_FIELDS,
    });
    await this.audit.log(actor.id, 'CREATE', 'User', user.id, { accountNumber: user.accountNumber, rank, ...name, role: user.role, ...office });
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
    const officeChanged = ['role', 'officeLevel', 'districtId', 'cityId'].some((k) => k in dto);
    const office = officeChanged
      ? await this.office(role, {
          officeLevel: dto.officeLevel ?? target.officeLevel,
          districtId: 'districtId' in dto ? dto.districtId : target.districtId,
          cityId: 'cityId' in dto ? dto.cityId : target.cityId,
        })
      : {};
    // Rank is checked when the edit touches rank or role, so legacy accounts without one can still be disabled.
    const rank = 'rank' in dto || 'role' in dto ? rankFor(role, 'rank' in dto ? dto.rank : target.rank) : undefined;
    if (dto.accountNumber && dto.accountNumber !== target.accountNumber) await this.assertAccountNumberFree(dto.accountNumber);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        accountNumber: dto.accountNumber,
        rank,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        role,
        ...office,
        isActive: dto.isActive,
      },
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
      // Free the account number for reuse; '#' can't appear in a valid one, so the renamed value never clashes.
      data: { deletedAt: new Date(), isActive: false, accountNumber: `${target.accountNumber}#deleted-${Date.now()}` },
    });
    await this.tokens.revokeAll(id);
    await this.audit.log(actor.id, 'DELETE', 'User', id, { accountNumber: target.accountNumber });
  }

  private async find(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async assertAccountNumberFree(accountNumber: string) {
    if (await this.prisma.user.findUnique({ where: { accountNumber } })) {
      throw new ConflictException('Account number is already registered');
    }
  }

  private assertCanManage(actor: AuthUser, role: Role) {
    if (!canManageRole(actor, role)) throw new ForbiddenException(`You cannot manage ${role} accounts`);
  }

  /**
   * Validates and normalizes an office for a role (see OFFICE_LEVELS): Regional has no district or city,
   * a District office has a district, a City office has a city and the city's district.
   */
  private async office(role: Role, input: OfficeInput) {
    const officeLevel = input.officeLevel ?? OfficeLevel.REGIONAL;
    if (!OFFICE_LEVELS[role].includes(officeLevel)) {
      throw new BadRequestException(`${role} accounts can't be at a ${officeLevel} office`);
    }
    if (officeLevel === OfficeLevel.REGIONAL) return { officeLevel, districtId: null, cityId: null };
    if (officeLevel === OfficeLevel.DISTRICT) {
      if (!input.districtId || !(await this.prisma.fireDistrict.findUnique({ where: { id: input.districtId } }))) {
        throw new BadRequestException('A district office needs a valid fire district');
      }
      return { officeLevel, districtId: input.districtId, cityId: null };
    }
    const city = input.cityId ? await this.cities.get(input.cityId) : null;
    if (!city) throw new BadRequestException('A city office needs a valid city');
    return { officeLevel, districtId: city.districtId, cityId: city.id };
  }

}
