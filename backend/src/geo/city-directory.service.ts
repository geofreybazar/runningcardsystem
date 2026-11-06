import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { locateCity, type CityShape } from './city-locator.js';

export interface CityInfo {
  id: number;
  name: string;
  districtId: number;
}

/**
 * Cities, their districts and outlines: reference data loaded once per process.
 * shortcut: cached until restart; reseeding boundaries needs an API restart.
 */
@Injectable()
export class CityDirectory {
  private loading?: Promise<{ cities: CityInfo[]; shapes: CityShape[] }>;

  constructor(private readonly prisma: PrismaService) {}

  private load() {
    this.loading ??= this.prisma.city.findMany().then((rows) => ({
      cities: rows.map(({ id, name, districtId }) => ({ id, name, districtId })),
      shapes: rows
        .filter((r) => r.boundary)
        .map((r) => ({ name: r.name, ...(r.boundary as Omit<CityShape, 'name'>) })),
    }));
    return this.loading;
  }

  async all() {
    return (await this.load()).cities;
  }

  /** The NCR city a point is in, or null when it is outside NCR. */
  async cityAt(lat: number, lng: number): Promise<CityInfo | null> {
    const { cities, shapes } = await this.load();
    const name = locateCity(shapes, lat, lng);
    return cities.find((c) => c.name === name) ?? null;
  }

  async get(id: number) {
    return (await this.load()).cities.find((c) => c.id === id) ?? null;
  }

  async ofDistrict(districtId: number) {
    return (await this.load()).cities.filter((c) => c.districtId === districtId);
  }
}
