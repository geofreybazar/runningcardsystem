import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth-user.js';
import { UserLoader } from './user-loader.service.js';
import { LoginAttempts } from './login-attempts.js';

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
  ) {}

  async login(accountNumber: string, password: string) {
    this.attempts.assertAllowed(accountNumber); // paused: don't even check the password
    const found = await this.prisma.user.findFirst({ where: { accountNumber, deletedAt: null } });
    // verify() checks a dummy hash when there is no account, so timing doesn't reveal account numbers.
    const valid = await this.hasher.verify(password, found?.passwordHash);
    if (!found || !valid || !found.isActive) {
      this.attempts.failed(accountNumber);
      throw new UnauthorizedException('Invalid account number or password');
    }
    this.attempts.succeeded(accountNumber);
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
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await this.hasher.hash(newPassword), mustChangePassword: false },
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
