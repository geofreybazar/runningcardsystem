import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { DeploymentsController } from './deployments.controller.js';
import { DeploymentsService } from './deployments.service.js';

@Module({ imports: [NotificationsModule], controllers: [DeploymentsController], providers: [DeploymentsService] })
export class DeploymentsModule {}
