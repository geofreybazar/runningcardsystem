import { Module } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module.js';
import { RunningCardController } from './running-card.controller.js';
import { RunningCardService } from './running-card.service.js';

@Module({ imports: [RoutingModule], controllers: [RunningCardController], providers: [RunningCardService], exports: [RunningCardService] })
export class RunningCardModule {}
