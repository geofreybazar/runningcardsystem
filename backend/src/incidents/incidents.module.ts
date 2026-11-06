import { Module } from '@nestjs/common';
import { RunningCardModule } from '../running-card/running-card.module.js';
import { IncidentsController } from './incidents.controller.js';
import { IncidentsService } from './incidents.service.js';

@Module({ imports: [RunningCardModule], controllers: [IncidentsController], providers: [IncidentsService] })
export class IncidentsModule {}
