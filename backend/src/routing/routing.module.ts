import { Module } from '@nestjs/common';
import { RoadDistanceService } from './road-distance.service.js';

@Module({ providers: [{ provide: RoadDistanceService, useFactory: () => new RoadDistanceService() }], exports: [RoadDistanceService] })
export class RoutingModule {}
