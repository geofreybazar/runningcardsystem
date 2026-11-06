import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuth } from './jwt-auth.provider.js';
import { PrismaRefreshTokenStore } from './prisma-refresh-token.store.js';
import { AccessPolicy } from './access.policy.js';
import { UserLoader } from './user-loader.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuth, PrismaRefreshTokenStore, AccessPolicy, UserLoader],
  exports: [AccessPolicy],
})
export class AuthModule {}
