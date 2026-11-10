import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import { IncidentsService } from './incidents.service.js';
import {
  createIncidentSchema,
  incidentQuerySchema,
  raiseAlarmSchema,
  requestSpecialUnitSchema,
  specialUnitsQuerySchema,
  type CreateIncidentDto,
  type IncidentQuery,
  type RaiseAlarmDto,
  type RequestSpecialUnitDto,
  type SpecialUnitsQuery,
} from './incidents.dto.js';

@Controller('incidents')
@Can(AccessPolicy, 'operate')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query({ schema: incidentQuerySchema }) query: IncidentQuery) {
    return this.incidents.list(user, query.status, query.take);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidents.get(user, id);
  }

  @Can(AccessPolicy, 'dispatch')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body({ schema: createIncidentSchema }) dto: CreateIncidentDto) {
    return this.incidents.create(user, dto);
  }

  @Can(AccessPolicy, 'dispatch')
  @Get(':id/next-alarm')
  nextAlarm(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidents.previewNextAlarm(user, id);
  }

  @Can(AccessPolicy, 'dispatch')
  @Post(':id/raise')
  @HttpCode(200)
  raise(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body({ schema: raiseAlarmSchema }) dto: RaiseAlarmDto) {
    return this.incidents.raise(user, id, dto.truckPicks);
  }

  @Can(AccessPolicy, 'dispatch')
  @Get(':id/special-units')
  specialUnits(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query({ schema: specialUnitsQuerySchema }) query: SpecialUnitsQuery) {
    return this.incidents.specialUnits(user, id, query.type);
  }

  @Can(AccessPolicy, 'dispatch')
  @Post(':id/special-units')
  @HttpCode(200)
  requestSpecialUnit(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body({ schema: requestSpecialUnitSchema }) dto: RequestSpecialUnitDto) {
    return this.incidents.requestSpecialUnit(user, id, dto.truckId);
  }

  @Can(AccessPolicy, 'dispatch')
  @Post(':id/close')
  @HttpCode(200)
  close(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidents.close(user, id);
  }
}
