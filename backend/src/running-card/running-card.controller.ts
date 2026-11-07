import { Controller, Get, Query } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { AccessPolicy } from '../auth/access.policy.js';
import { RunningCardService } from './running-card.service.js';
import { CityDirectory } from '../geo/city-directory.service.js';

const runningCardQuerySchema = z.strictObject({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

@Controller('running-card')
export class RunningCardController {
  constructor(
    private readonly runningCard: RunningCardService,
    private readonly cities: CityDirectory,
  ) {}

  @Get()
  @Can(AccessPolicy, 'viewRunningCard')
  /** Radio operators may preview any card; `city` tells the UI whose dispatchers own this location (null = outside NCR). */
  async get(@Query({ schema: runningCardQuerySchema }) { lat, lng }: z.infer<typeof runningCardQuerySchema>) {
    const [city, alarms] = await Promise.all([this.cities.cityAt(lat, lng), this.runningCard.generate({ lat, lng })]);
    return { city, alarms };
  }
}
