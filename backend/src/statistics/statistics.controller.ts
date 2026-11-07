import { Controller, Get, Query, Res } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { Response } from 'express';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import { StatisticsService } from './statistics.service.js';
import { statisticsQuerySchema, type StatisticsQuery } from './statistics.dto.js';

/** Statistics follow incident visibility: offices see their area, Regional accounts all of NCR. */
@Controller('statistics')
@Can(AccessPolicy, 'operate')
export class StatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @Query({ schema: statisticsQuerySchema }) query: StatisticsQuery) {
    return this.statistics.statistics(user, query);
  }

  @Get('incidents.csv')
  async csv(@CurrentUser() user: AuthUser, @Query({ schema: statisticsQuerySchema }) query: StatisticsQuery, @Res({ passthrough: true }) res: Response) {
    const { body, filename } = await this.statistics.csv(user, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return body;
  }
}
