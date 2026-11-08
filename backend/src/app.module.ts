import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { GeoModule } from './geo/geo.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DistrictsModule } from './districts/districts.module.js';
import { StationsModule } from './stations/stations.module.js';
import { RunningCardModule } from './running-card/running-card.module.js';
import { IncidentsModule } from './incidents/incidents.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { DeploymentsModule } from './deployments/deployments.module.js';

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
    // Every route, per client IP. Generous: one radio room may share an IP and pages reload on live events.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: Number(process.env.GLOBAL_RATE_LIMIT ?? 600) }]),
    PrismaModule,
    GeoModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DistrictsModule,
    StationsModule,
    RunningCardModule,
    IncidentsModule,
    SettingsModule,
    NotificationsModule,
    StatisticsModule,
    DeploymentsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
