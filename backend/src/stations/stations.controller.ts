import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import { StationsService } from './stations.service.js';
import { CreateStationDto, CreateTruckDto, StationQuery, UpdateStationDto, UpdateTruckDto } from './stations.dto.js';

@Controller()
export class StationsController {
  constructor(private readonly stations: StationsService) {}

  @Get('stations')
  @Can(AccessPolicy, 'operate')
  list(@Query() query: StationQuery) {
    return this.stations.list(query.districtId, query.cityId);
  }

  @Post('stations')
  @Can(AccessPolicy, 'editStations')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStationDto) {
    return this.stations.create(user, dto);
  }

  @Patch('stations/:id')
  @Can(AccessPolicy, 'editStations')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStationDto) {
    return this.stations.update(user, id, dto);
  }

  @Post('stations/:id/trucks')
  @Can(AccessPolicy, 'editStations')
  addTruck(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CreateTruckDto) {
    return this.stations.addTruck(user, id, dto);
  }

  @Patch('trucks/:id')
  @Can(AccessPolicy, 'editStations')
  updateTruck(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTruckDto) {
    return this.stations.updateTruck(user, id, dto);
  }

  @Delete('trucks/:id')
  @Can(AccessPolicy, 'editStations')
  @HttpCode(204)
  removeTruck(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.stations.removeTruck(user, id);
  }
}
