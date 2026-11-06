import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildRunningCard, type LatLng } from './running-card.logic.js';

@Injectable()
export class RunningCardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Live card: only active stations that have at least one available truck, each listing those trucks. */
  async generate(origin: LatLng, { excludeStationIds = [] as number[] } = {}) {
    const [settings, stations] = await Promise.all([
      this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
      this.prisma.station.findMany({
        where: {
          isActive: true,
          id: { notIn: excludeStationIds },
          trucks: { some: { isActive: true, status: 'AVAILABLE' } },
        },
        select: {
          id: true,
          name: true,
          lat: true,
          lng: true,
          contactNumber: true,
          district: { select: { code: true, name: true, color: true } },
          trucks: {
            where: { isActive: true, status: 'AVAILABLE' },
            select: { id: true, callSign: true, type: true, plateNumber: true, waterCapacityLiters: true },
            orderBy: { id: 'asc' },
          },
        },
      }),
    ]);
    return buildRunningCard(origin, stations, settings);
  }
}
