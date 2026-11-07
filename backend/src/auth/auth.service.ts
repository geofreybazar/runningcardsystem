import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth-user.js';
import { UserLoader } from './user-loader.service.js';
import { LoginAttempts } from './login-attempts.js';
import { AuditService } from '../audit/audit.service.js';

const subOf = (accessToken: string): string =>
  JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString()).sub;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly users: UserLoader,
    private readonly attempts: LoginAttempts,
    private readonly audit: AuditService,
  ) {}

  /** Every attempt is audited (entity "Session"), with the client IP; the caller only ever sees one failure message. */
  async login(accountNumber: string, password: string, ip?: string) {
    const failed = (userId: string | null, reason: string) =>
      this.audit.log(userId, 'SIGN_IN_FAILED', 'Session', userId ?? accountNumber, { accountNumber, reason }, { ip });
    try {
      this.attempts.assertAllowed(accountNumber); // paused: don't even check the password
    } catch (error) {
      await failed(null, 'paused after repeated failures');
      throw error;
    }
    const found = await this.prisma.user.findFirst({ where: { accountNumber, deletedAt: null } });
    // verify() checks a dummy hash when there is no account, so timing doesn't reveal account numbers.
    const valid = await this.hasher.verify(password, found?.passwordHash);
    if (!found || !valid || !found.isActive) {
      this.attempts.failed(accountNumber);
      await failed(found?.id ?? null, !found ? 'unknown account number' : !valid ? 'wrong password' : 'account disabled');
      throw new UnauthorizedException('Invalid account number or password');
    }
    this.attempts.succeeded(accountNumber);
    await this.audit.log(found.id, 'SIGN_IN', 'Session', found.id, { accountNumber }, { ip });
    if (this.hasher.needsRehash(found.passwordHash)) {
      await this.prisma.user.update({ where: { id: found.id }, data: { passwordHash: await this.hasher.hash(password) } });
    }
    const pair = await this.tokens.issue(found.id, { method: 'pwd' });
    return { ...pair, user: await this.loadUser(found.id) };
  }

  async refresh(refreshToken: string) {
    const pair = await this.tokens.refresh(refreshToken); // throws RefreshTokenError (401) on invalid/expired/reused
    const user = await this.loadUser(subOf(pair.accessToken));
    if (!user) {
      await this.tokens.revoke(pair.refreshToken);
      throw new UnauthorizedException('Account is disabled');
    }
    return { ...pair, user };
  }

  logout(refreshToken: string | undefined) {
    return refreshToken ? this.tokens.revoke(refreshToken).catch(() => false) : false;
  }

  async changePassword(user: AuthUser, currentPassword: string, newPassword: string) {
    const { passwordHash } = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await this.hasher.verify(currentPassword, passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (currentPassword === newPassword) throw new BadRequestException('New password must be different');
    const newHash = await this.hasher.hash(newPassword);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: newHash, mustChangePassword: false } });
      await this.audit.log(user.id, 'CHANGE_PASSWORD', 'User', user.id, { firstTime: user.mustChangePassword }, { db: tx });
    });
    // Sign out every other device, then hand this one a fresh pair.
    await this.tokens.revokeAll(user.id);
    const pair = await this.tokens.issue(user.id, { method: 'pwd' });
    return { ...pair, user: await this.loadUser(user.id) };
  }

  loadUser(id: string): Promise<AuthUser | null> {
    return this.users.load(id);
  }
}
