import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuth } from './jwt-auth.provider.js';
import { PrismaRefreshTokenStore } from './prisma-refresh-token.store.js';
import { AccessPolicy } from './access.policy.js';
import { UserLoader } from './user-loader.service.js';
import { LoginAttempts } from './login-attempts.js';
import { AuthAuditListener } from './auth-audit.listener.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuth, PrismaRefreshTokenStore, AccessPolicy, UserLoader, AuthAuditListener, { provide: LoginAttempts, useValue: new LoginAttempts() }],
  exports: [AccessPolicy],
})
export class AuthModule {}
