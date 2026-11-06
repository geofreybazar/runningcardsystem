import { Module } from '@nestjs/common';
import { RunningCardController } from './running-card.controller.js';
import { RunningCardService } from './running-card.service.js';

@Module({ controllers: [RunningCardController], providers: [RunningCardService], exports: [RunningCardService] })
export class RunningCardModule {}
