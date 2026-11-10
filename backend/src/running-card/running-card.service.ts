import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { buildRunningCard, haversineKm, type LatLng } from './running-card.logic.js';
import { RUNNING_CARD_TRUCK_TYPES, type SPECIAL_TRUCK_TYPES } from '../shared/validation.js';

const STATION_SELECT = {
  id: true,
  name: true,
  lat: true,
  lng: true,
  contactNumber: true,
  city: { select: { name: true } },
  district: { select: { code: true, name: true, color: true } },
} as const;
const TRUCK_SELECT = { id: true, callSign: true, type: true, plateNumber: true, waterCapacityLiters: true } as const;

@Injectable()
export class RunningCardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Live card: only active stations with an available Mini Pumper, Engine or Tanker, each listing those trucks. */
  async generate(origin: LatLng, { excludeStationIds = [] as number[] } = {}) {
    const onCard: Prisma.TruckWhereInput = { isActive: true, status: 'AVAILABLE', type: { in: [...RUNNING_CARD_TRUCK_TYPES] } };
    const [settings, stations] = await Promise.all([
      this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
      this.prisma.station.findMany({
        where: { isActive: true, id: { notIn: excludeStationIds }, trucks: { some: onCard } },
        select: { ...STATION_SELECT, trucks: { where: onCard, select: TRUCK_SELECT, orderBy: { id: 'asc' } } },
      }),
    ]);
    return buildRunningCard(origin, stations, settings);
  }

  /** Nearest active stations (within the card's range) with an available truck of one special type. */
  async nearestWithType(origin: LatLng, type: (typeof SPECIAL_TRUCK_TYPES)[number], limit = 5) {
    const ofType: Prisma.TruckWhereInput = { isActive: true, status: 'AVAILABLE', type };
    const [settings, stations] = await Promise.all([
      this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
      this.prisma.station.findMany({
        where: { isActive: true, trucks: { some: ofType } },
        select: { ...STATION_SELECT, trucks: { where: ofType, select: TRUCK_SELECT, orderBy: { id: 'asc' } } },
      }),
    ]);
    return stations
      .map((s) => ({ ...s, distance: haversineKm(origin, s) }))
      .filter((s) => s.distance <= settings.maxDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }
}
