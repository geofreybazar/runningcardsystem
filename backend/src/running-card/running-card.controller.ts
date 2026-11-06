import { Controller, Get, Query } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';
import { AccessPolicy } from '../auth/access.policy.js';
import { RunningCardService } from './running-card.service.js';

class RunningCardQuery {
  @Type(() => Number) @IsLatitude() lat: number;
  @Type(() => Number) @IsLongitude() lng: number;
}

@Controller('running-card')
export class RunningCardController {
  constructor(private readonly runningCard: RunningCardService) {}

  @Get()
  @Can(AccessPolicy, 'operate')
  get(@Query() { lat, lng }: RunningCardQuery) {
    return this.runningCard.generate({ lat, lng });
  }
}
