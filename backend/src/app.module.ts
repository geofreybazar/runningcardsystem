import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DistrictsModule } from './districts/districts.module.js';
import { StationsModule } from './stations/stations.module.js';
import { RunningCardModule } from './running-card/running-card.module.js';
import { IncidentsModule } from './incidents/incidents.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Authentication must come before authorization: both register global guards, in this order.
    AuthenticationModule.forRootAsync({
      useFactory: () => ({
        accessToken: { key: process.env.JWT_SECRET!, issuer: 'bfp-ncr-rcs', audience: 'rcs-web', ttl: '15m' },
        refreshToken: { ttl: '7d', absoluteTtl: '30d' },
      }),
    }),
    AuthorizationModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DistrictsModule,
    StationsModule,
    RunningCardModule,
    IncidentsModule,
  ],
})
export class AppModule {}
