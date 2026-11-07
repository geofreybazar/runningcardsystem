import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PERSON_SELECT, type AuthUser } from '../auth/auth-user.js';
import { incidentVisibility } from '../incidents/incidents.service.js';
import { addDays, computeStatistics, csvCell, manilaDateTime, manilaRange, manilaToday } from './statistics.logic.js';
import type { StatisticsQuery } from './statistics.dto.js';

const INCLUDE = {
  city: { select: { name: true, district: { select: { code: true, name: true, alias: true } } } },
  barangay: { select: { name: true } },
  createdBy: { select: PERSON_SELECT },
  units: {
    select: {
      alarmLevel: true,
      dispatchedAt: true,
      releasedAt: true,
      station: { select: { id: true, name: true, cityId: true, city: { select: { name: true } } } },
      truck: { select: { id: true, callSign: true } },
    },
  },
} as const;

const person = (p: { rank: string | null; firstName: string; middleName: string | null; lastName: string }) =>
  [p.rank, p.firstName, p.middleName && `${p.middleName[0]}.`, p.lastName].filter(Boolean).join(' ');

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The default range is the last 30 days (Manila calendar). */
  private range(q: StatisticsQuery) {
    const to = q.to ?? manilaToday();
    const from = q.from ?? addDays(to, -29);
    return { from, to };
  }

  /** Incidents the user may see, dispatched in the range, narrowed to a district or city. */
  private async load(user: AuthUser, q: StatisticsQuery) {
    const { from, to } = this.range(q);
    const { start, end } = manilaRange(from, to);
    const [incidents, settings] = await Promise.all([
      this.prisma.incident.findMany({
        where: {
          AND: [
            incidentVisibility(user),
            { createdAt: { gte: start, lt: end } },
            q.districtId ? { city: { districtId: q.districtId } } : {},
            q.cityId ? { cityId: q.cityId } : {},
          ],
        },
        include: INCLUDE,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
    ]);
    return { from, to, incidents, alarmLevels: settings.alarmLevels };
  }

  async statistics(user: AuthUser, q: StatisticsQuery) {
    const { from, to, incidents, alarmLevels } = await this.load(user, q);
    return computeStatistics(incidents, { from, to, alarmLevels });
  }

  /** The incident list behind the statistics, one row per incident. */
  async csv(user: AuthUser, q: StatisticsQuery) {
    const { from, to, incidents, alarmLevels } = await this.load(user, q);
    const header = ['Dispatched (Manila)', 'Location', 'Barangay', 'City', 'District', 'Highest alarm', 'Status', 'Closed (Manila)', 'Duration (min)', 'Trucks sent', 'Mutual-aid trucks', 'Dispatched by'];
    const rows = incidents.map((i) => [
      manilaDateTime(i.createdAt),
      i.locationLabel,
      i.barangay?.name,
      i.city?.name,
      i.city?.district.name,
      alarmLevels[i.alarmIndex],
      i.status,
      manilaDateTime(i.closedAt),
      i.closedAt ? Math.round((i.closedAt.getTime() - i.createdAt.getTime()) / 60_000) : '',
      i.units.length,
      i.units.filter((u) => u.station.cityId !== null && i.cityId !== null && u.station.cityId !== i.cityId).length,
      person(i.createdBy),
    ]);
    // BOM: Excel opens UTF-8 (ñ in names) correctly.
    const body = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
    return { body, filename: `running-card-incidents_${from}_to_${to}.csv` };
  }
}
