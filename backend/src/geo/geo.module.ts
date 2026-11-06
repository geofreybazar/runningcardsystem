import { Global, Module } from '@nestjs/common';
import { CityDirectory } from './city-directory.service.js';

@Global()
@Module({ providers: [CityDirectory], exports: [CityDirectory] })
export class GeoModule {}
