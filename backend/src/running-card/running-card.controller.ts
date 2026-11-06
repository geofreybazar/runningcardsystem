import { Controller, Get, Query } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';
import { AccessPolicy } from '../auth/access.policy.js';
import { RunningCardService } from './running-card.service.js';
import { CityDirectory } from '../geo/city-directory.service.js';

class RunningCardQuery {
  @Type(() => Number) @IsLatitude() lat: number;
  @Type(() => Number) @IsLongitude() lng: number;
}

@Controller('running-card')
export class RunningCardController {
  constructor(
    private readonly runningCard: RunningCardService,
    private readonly cities: CityDirectory,
  ) {}

  @Get()
  @Can(AccessPolicy, 'operate')
  /** Anyone may preview a card; `city` tells the UI whose dispatchers own this location (null = outside NCR). */
  async get(@Query() { lat, lng }: RunningCardQuery) {
    const [city, alarms] = await Promise.all([this.cities.cityAt(lat, lng), this.runningCard.generate({ lat, lng })]);
    return { city, alarms };
  }
}
