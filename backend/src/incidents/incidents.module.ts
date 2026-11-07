import { Module } from '@nestjs/common';
import { RunningCardModule } from '../running-card/running-card.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { IncidentsController } from './incidents.controller.js';
import { IncidentsService } from './incidents.service.js';

@Module({ imports: [RunningCardModule, NotificationsModule], controllers: [IncidentsController], providers: [IncidentsService] })
export class IncidentsModule {}
