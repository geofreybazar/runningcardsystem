import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { AccessPolicy } from '../auth/access.policy.js';
import { CityDirectory } from '../geo/city-directory.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RunningCardService } from '../running-card/running-card.service.js';
import { PERSON_SELECT, type AuthUser } from '../auth/auth-user.js';
import type { CreateIncidentDto, TruckPicks } from './incidents.dto.js';

type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];
type CardStation = Awaited<ReturnType<RunningCardService['generate']>>[number]['stations'][number];

const DETAIL_INCLUDE = {
  city: { select: { id: true, name: true } },
  barangay: { select: { name: true, city: { select: { name: true } } } },
  createdBy: { select: PERSON_SELECT },
  closedBy: { select: PERSON_SELECT },
  units: {
    orderBy: { id: 'asc' },
    include: {
      station: { select: { id: true, name: true, districtId: true, district: { select: { code: true, name: true, color: true } } } },
      truck: { select: { id: true, callSign: true, type: true, plateNumber: true, status: true } },
    },
  },
} as const;

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runningCard: RunningCardService,
    private readonly cities: CityDirectory,
    private readonly authz: AuthorizationService,
  ) {}

  /** Offices see incidents in their cities, plus ones their stations responded to. Regional accounts see all. */
  private visibleTo(user: AuthUser) {
    const area = user.areaCityIds;
    if (area === null) return {};
    return { OR: [{ cityId: { in: area } }, { units: { some: { station: { cityId: { in: area } } } } }] };
  }

  /** Operations see incidents their district responded to; everyone else sees all. */
  async list(user: AuthUser, status?: 'OPEN' | 'CLOSED', take = 100) {
    const levels = await this.alarmLevels();
    const incidents = await this.prisma.incident.findMany({
      where: { status, ...this.visibleTo(user) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 500),
      include: {
        createdBy: { select: PERSON_SELECT },
        city: { select: { name: true } },
        _count: { select: { units: true } },
      },
      omit: { runningCard: true },
    });
    return incidents.map((i) => ({ ...i, alarmLevel: levels[i.alarmIndex] }));
  }

  async get(user: AuthUser, id: string) {
    const incident = await this.prisma.incident.findFirst({ where: { id, ...this.visibleTo(user) }, include: DETAIL_INCLUDE });
    if (!incident) {
      if (await this.prisma.incident.count({ where: { id } })) throw new ForbiddenException('This incident is outside your area');
      throw new NotFoundException('Incident not found');
    }
    const levels = await this.alarmLevels();
    return { ...incident, alarmLevel: levels[incident.alarmIndex], nextAlarmLevel: levels[incident.alarmIndex + 1] ?? null };
  }

  /** Saves the incident and dispatches the 1st Alarm in one transaction. */
  async create(user: AuthUser, dto: CreateIncidentDto) {
    const city = await this.cities.cityAt(dto.lat, dto.lng);
    if (!city) throw new BadRequestException('This location is outside Metro Manila');
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, city.id);
    const card = await this.runningCard.generate(dto);
    if (card.length === 0) throw new BadRequestException('No station with an available truck is within range');
    const id = await this.prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          lat: dto.lat,
          lng: dto.lng,
          locationLabel: dto.locationLabel,
          barangayId: dto.barangayId,
          cityId: city.id,
          notes: dto.notes,
          runningCard: card as object,
          createdById: user.id,
        },
      });
      const sent = await this.dispatch(tx, incident.id, card[0].alarmLevel, card[0].stations, dto.truckPicks);
      if (sent === 0) throw new ConflictException('Every truck on the 1st Alarm became unavailable. Refresh the running card.');
      return incident.id;
    });
    return this.get(user, id);
  }

  /** What "Raise alarm" would send now: the nearest stations not yet on this incident. */
  async nextAlarm(id: string) {
    const incident = await this.openIncident(id);
    const levels = await this.alarmLevels();
    const alarmLevel = levels[incident.alarmIndex + 1];
    if (!alarmLevel) return null;
    const card = await this.runningCard.generate(incident, { excludeStationIds: incident.units.map((u) => u.stationId) });
    return { alarmLevel, fromAlarmIndex: incident.alarmIndex, stations: card[0]?.stations ?? [] };
  }

  async raise(user: AuthUser, id: string, truckPicks?: TruckPicks) {
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, (await this.openIncident(id)).cityId);
    const next = await this.nextAlarm(id);
    if (!next) throw new BadRequestException('This incident is already at the highest alarm level');
    if (next.stations.length === 0) throw new ConflictException('No more stations with an available truck are within range');
    await this.prisma.$transaction(async (tx) => {
      // Conditional bump: two operators pressing Raise at once advance it only once.
      const { count } = await tx.incident.updateMany({
        where: { id, status: 'OPEN', alarmIndex: next.fromAlarmIndex },
        data: { alarmIndex: { increment: 1 } },
      });
      if (count === 0) throw new ConflictException('The incident changed meanwhile. Reload and try again.');
      const sent = await this.dispatch(tx, id, next.alarmLevel, next.stations, truckPicks);
      if (sent === 0) throw new ConflictException('Those trucks became unavailable. Reload and try again.');
    });
    return this.get(user, id);
  }

  /** Closes the incident and frees its trucks, unless Operations marked one out of service meanwhile. */
  async close(user: AuthUser, id: string) {
    const incident = await this.openIncident(id);
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, incident.cityId);
    const active = incident.units.filter((u) => !u.releasedAt);
    await this.prisma.$transaction([
      this.prisma.truck.updateMany({
        where: { id: { in: active.map((u) => u.truckId) }, status: 'RESPONDING' },
        data: { status: 'AVAILABLE' },
      }),
      this.prisma.incidentUnit.updateMany({ where: { incidentId: id, releasedAt: null }, data: { releasedAt: new Date() } }),
      this.prisma.incident.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), closedById: user.id } }),
    ]);
    return this.get(user, id);
  }

  /**
   * One truck per station: the operator's pick if it is still available, otherwise the station's next available truck.
   * Each truck is claimed with a conditional update, so a truck can't be sent to two incidents at once.
   */
  private async dispatch(tx: Tx, incidentId: string, alarmLevel: string, stations: CardStation[], picks: TruckPicks = {}) {
    let sent = 0;
    for (const station of stations) {
      const preferred = station.trucks.find((t) => t.id === picks[station.id]);
      const candidates = preferred ? [preferred, ...station.trucks.filter((t) => t !== preferred)] : station.trucks;
      for (const truck of candidates) {
        const { count } = await tx.truck.updateMany({
          where: { id: truck.id, status: 'AVAILABLE', isActive: true },
          data: { status: 'RESPONDING' },
        });
        if (count === 1) {
          await tx.incidentUnit.create({ data: { incidentId, stationId: station.id, truckId: truck.id, alarmLevel } });
          sent++;
          break;
        }
      }
    }
    return sent;
  }

  private async openIncident(id: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id }, include: { units: true } });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== 'OPEN') throw new BadRequestException('This incident is closed');
    return incident;
  }

  private async alarmLevels() {
    return (await this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } })).alarmLevels;
  }
}
