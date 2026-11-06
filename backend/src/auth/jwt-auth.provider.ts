import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';
import { AUTH_USER_SELECT, type AuthUser } from './auth-user.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<AuthUser> {
  constructor(
    private readonly prisma: PrismaService,
    registry: AuthenticationRegistry,
  ) {
    super({ realm: 'rcs' });
    registry.registerProvider(this);
  }

  // Loads the user on every request so disabling, removing or a role change applies immediately.
  validate({ sub }: JwtClaims) {
    if (!sub) return null;
    return this.prisma.user.findFirst({
      where: { id: sub, isActive: true, deletedAt: null },
      select: AUTH_USER_SELECT,
    });
  }
}
