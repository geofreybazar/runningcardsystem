import { Module } from '@nestjs/common';
import { DistrictsController } from './districts.controller.js';

@Module({ controllers: [DistrictsController] })
export class DistrictsModule {}
