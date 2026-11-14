import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { AccessPolicy } from '../auth/access.policy.js';
import { CityDirectory } from '../geo/city-directory.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RunningCardService } from '../running-card/running-card.service.js';
import { PERSON_SELECT, type AuthUser } from '../auth/auth-user.js';
import type { CreateIncidentDto, TruckPicks } from './incidents.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditService } from '../audit/audit.service.js';
import { claimTruck, releaseTrucks } from '../stations/truck-claims.js';
import { SPECIAL_TRUCK_TYPES } from '../shared/validation.js';

type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];
type CardStation = Awaited<ReturnType<RunningCardService['generate']>>[number]['stations'][number];

const DETAIL_INCLUDE = {
  city: { select: { id: true, name: true } },
  barangay: { select: { name: true, city: { select: { name: true } } } },
  createdBy: { select: PERSON_SELECT },
  closedBy: { select: PERSON_SELECT },
  notifications: { select: { type: true, alarmLevel: true, units: true, createdAt: true, actor: { select: PERSON_SELECT } }, orderBy: { id: 'asc' } },
  units: {
    orderBy: { id: 'asc' },
    include: {
      station: { select: { id: true, name: true, lat: true, lng: true, cityId: true, city: { select: { name: true } }, districtId: true, district: { select: { code: true, name: true, color: true } } } },
      truck: { select: { id: true, callSign: true, type: true, plateNumber: true, status: true } },
    },
  },
} as const;

type DetailIncident = { units: { alarmLevel: string; dispatchedAt: Date }[]; closedAt: Date | null; closedBy: object | null; createdBy: object } & {
  notifications: { type: string; alarmLevel: string | null; units: unknown; createdAt: Date; actor: object }[]; // incident steps always set alarmLevel
};

/**
 * Time log of the incident: one entry per dispatch / alarm raised / close, with who did it and how many trucks moved.
 * Each step writes a notification, so they are the log; incidents from before notifications existed fall back to the units.
 */
function timeline(i: DetailIncident) {
  if (i.notifications.length) {
    return i.notifications.map((n) => ({ type: n.type, alarmLevel: n.alarmLevel, at: n.createdAt, by: n.actor, trucks: (n.units as unknown[]).length }));
  }
  const levels = [...new Set(i.units.map((u) => u.alarmLevel))];
  const steps = levels.map((alarmLevel, idx) => {
    const units = i.units.filter((u) => u.alarmLevel === alarmLevel);
    return { type: idx === 0 ? 'DISPATCHED' : 'ALARM_RAISED', alarmLevel, at: units[0].dispatchedAt, by: idx === 0 ? i.createdBy : null, trucks: units.length };
  });
  if (i.closedAt) steps.push({ type: 'INCIDENT_CLOSED', alarmLevel: levels.at(-1) ?? '', at: i.closedAt, by: i.closedBy, trucks: i.units.length });
  return steps;
}

/**
 * Incidents an account may see: offices see incidents in their cities, ones their stations responded to, and ones
 * that notified them (e.g. their station was on the running card). Regional accounts see all.
 * Shared with the statistics, so both follow the same rule.
 */
export function incidentVisibility(user: AuthUser) {
  const area = user.areaCityIds;
  if (area === null) return {};
  return {
    OR: [
      { cityId: { in: area } },
      { units: { some: { station: { cityId: { in: area } } } } },
      { notifications: { some: { cityIds: { hasSome: area } } } },
    ],
  };
}

/** "E-12 (Gagalangin Fire Sub-station)" for each truck, for the audit log. */
const trucksOf = (units: { station: { name: string }; truck: { callSign: string } }[]) => units.map((u) => `${u.truck.callSign} (${u.station.name})`);

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runningCard: RunningCardService,
    private readonly cities: CityDirectory,
    private readonly authz: AuthorizationService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}


  /** Operations see incidents their district responded to; everyone else sees all. */
  async list(user: AuthUser, status?: 'OPEN' | 'CLOSED', take = 100) {
    const levels = await this.alarmLevels();
    const incidents = await this.prisma.incident.findMany({
      where: { status, ...incidentVisibility(user) },
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
    const incident = await this.prisma.incident.findFirst({ where: { id, ...incidentVisibility(user) }, include: DETAIL_INCLUDE });
    if (!incident) {
      if (await this.prisma.incident.count({ where: { id } })) throw new ForbiddenException('This incident is outside your area');
      throw new NotFoundException('Incident not found');
    }
    const levels = await this.alarmLevels();
    const { notifications: _notifications, ...rest } = incident; // the timeline replaces the raw notifications
    return { ...rest, alarmLevel: levels[incident.alarmIndex], nextAlarmLevel: levels[incident.alarmIndex + 1] ?? null, timeline: timeline(incident) };
  }

  /** Saves the incident and dispatches the 1st Alarm in one transaction. */
  async create(user: AuthUser, dto: CreateIncidentDto) {
    const city = await this.cities.cityAt(dto.lat, dto.lng);
    if (!city) throw new BadRequestException('This location is outside Metro Manila');
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, city.id);
    const card = await this.runningCard.generate(dto);
    if (card.length === 0) throw new BadRequestException('No station with an available truck is within range');
    const [id, notified] = await this.prisma.$transaction(async (tx) => {
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
      if (sent.length === 0) throw new ConflictException('Every truck on the 1st Alarm became unavailable. Refresh the running card.');
      const trucks = trucksOf(sent);
      await this.audit.log(user.id, 'DISPATCH', 'Incident', incident.id, { locationLabel: dto.locationLabel, city: city.name, alarmLevel: card[0].alarmLevel, trucks }, { db: tx });
      return [incident.id, await this.notifications.record(tx, incident.id, 'DISPATCHED', card[0].alarmLevel, user.id, sent)] as const;
    });
    await this.notifications.publish(notified);
    return this.get(user, id);
  }

  /** The preview for the dispatchers of the incident's city only, like raise itself. */
  async previewNextAlarm(user: AuthUser, id: string) {
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, (await this.openIncident(id)).cityId);
    return this.nextAlarm(id);
  }

  /** What "Raise alarm" would send now: the nearest stations, minus outside-city stations already on this incident. */
  async nextAlarm(id: string) {
    const incident = await this.openIncident(id);
    const levels = await this.alarmLevels();
    const alarmLevel = levels[incident.alarmIndex + 1];
    if (!alarmLevel) return null;
    // Stations of the fire's own city (their area of responsibility) send another truck on every alarm while they are among
    // the nearest; outside stations go once. A station that only sent a special unit still sends a pumper on the next alarm.
    const onAlarms = incident.units.filter((u) => !u.special && u.station.cityId !== incident.cityId).map((u) => u.stationId);
    const card = await this.runningCard.generate(incident, { excludeStationIds: onAlarms });
    return { alarmLevel, fromAlarmIndex: incident.alarmIndex, stations: card[0]?.stations ?? [] };
  }

  async raise(user: AuthUser, id: string, truckPicks?: TruckPicks) {
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, (await this.openIncident(id)).cityId);
    const next = await this.nextAlarm(id);
    if (!next) throw new BadRequestException('This incident is already at the highest alarm level');
    if (next.stations.length === 0) throw new ConflictException('No more stations with an available truck are within range');
    const notified = await this.prisma.$transaction(async (tx) => {
      // Conditional bump: two operators pressing Raise at once advance it only once.
      const { count } = await tx.incident.updateMany({
        where: { id, status: 'OPEN', alarmIndex: next.fromAlarmIndex },
        data: { alarmIndex: { increment: 1 } },
      });
      if (count === 0) throw new ConflictException('The incident changed meanwhile. Reload and try again.');
      const sent = await this.dispatch(tx, id, next.alarmLevel, next.stations, truckPicks);
      if (sent.length === 0) throw new ConflictException('Those trucks became unavailable. Reload and try again.');
      await this.audit.log(user.id, 'RAISE_ALARM', 'Incident', id, { alarmLevel: next.alarmLevel, trucks: trucksOf(sent) }, { db: tx });
      return this.notifications.record(tx, id, 'ALARM_RAISED', next.alarmLevel, user.id, sent);
    });
    await this.notifications.publish(notified);
    return this.get(user, id);
  }

  /** Nearest stations with an available special unit of `type`, for the dispatchers of the incident's city. */
  async specialUnits(user: AuthUser, id: string, type: (typeof SPECIAL_TRUCK_TYPES)[number]) {
    const incident = await this.openIncident(id);
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, incident.cityId);
    return this.runningCard.nearestWithType(incident, type);
  }

  /**
   * Sends one special unit at the fire city's request, right away if it is still available. It is recorded under the
   * current alarm level; the alarm itself does not change.
   */
  async requestSpecialUnit(user: AuthUser, id: string, truckId: number) {
    const incident = await this.openIncident(id);
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, incident.cityId);
    const truck = await this.prisma.truck.findFirst({ where: { id: truckId, isActive: true, station: { isActive: true } }, select: { type: true, stationId: true } });
    if (!truck) throw new NotFoundException('Truck not found');
    if (!(SPECIAL_TRUCK_TYPES as readonly string[]).includes(truck.type)) {
      throw new BadRequestException('Mini Pumpers, Engines and Tankers come with the running card; raise the alarm instead');
    }
    const alarmLevel = (await this.alarmLevels())[incident.alarmIndex];
    const notified = await this.prisma.$transaction(async (tx) => {
      if (!(await claimTruck(tx, truckId, 'RESPONDING'))) throw new ConflictException('That unit is no longer available. Reload and try again.');
      const unit = await tx.incidentUnit.create({
        data: { incidentId: id, stationId: truck.stationId, truckId, alarmLevel, special: true },
        select: { station: { select: { name: true, cityId: true, city: { select: { name: true } } } }, truck: { select: { callSign: true, type: true } } },
      });
      await this.audit.log(user.id, 'REQUEST_UNIT', 'Incident', id, { alarmLevel, type: unit.truck.type, trucks: trucksOf([unit]) }, { db: tx });
      return this.notifications.record(tx, id, 'UNIT_REQUESTED', alarmLevel, user.id, [unit]);
    });
    await this.notifications.publish(notified);
    return this.get(user, id);
  }

  /** Closes the incident and frees its trucks, unless Operations marked one out of service meanwhile. */
  async close(user: AuthUser, id: string) {
    const incident = await this.openIncident(id);
    await this.authz.authorize(AccessPolicy, 'dispatchIn', user, incident.cityId);
    const active = incident.units.filter((u) => !u.releasedAt);
    const levels = await this.alarmLevels();
    const notified = await this.prisma.$transaction(async (tx) => {
      await releaseTrucks(tx, active.map((u) => u.truckId), 'RESPONDING');
      await tx.incidentUnit.updateMany({ where: { incidentId: id, releasedAt: null }, data: { releasedAt: new Date() } });
      await tx.incident.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), closedById: user.id } });
      // Each city hears which of its trucks were released.
      await this.audit.log(user.id, 'CLOSE', 'Incident', id, { alarmLevel: levels[incident.alarmIndex], released: trucksOf(active) }, { db: tx });
      return this.notifications.record(tx, id, 'INCIDENT_CLOSED', levels[incident.alarmIndex], user.id, active);
    });
    await this.notifications.publish(notified);
    return this.get(user, id);
  }

  /**
   * One truck per station: the operator's pick if it is still available, otherwise the station's next available truck.
   * Each truck is claimed with a conditional update, so a truck can't be sent to two incidents at once.
   */
  private async dispatch(tx: Tx, incidentId: string, alarmLevel: string, stations: CardStation[], picks: TruckPicks = {}) {
    const sent = [];
    for (const station of stations) {
      const preferred = station.trucks.find((t) => t.id === picks[station.id]);
      const candidates = preferred ? [preferred, ...station.trucks.filter((t) => t !== preferred)] : station.trucks;
      for (const truck of candidates) {
        if (await claimTruck(tx, truck.id, 'RESPONDING')) {
          sent.push(
            await tx.incidentUnit.create({
              data: { incidentId, stationId: station.id, truckId: truck.id, alarmLevel },
              select: { station: { select: { name: true, cityId: true, city: { select: { name: true } } } }, truck: { select: { callSign: true } } },
            }),
          );
          break;
        }
      }
    }
    return sent;
  }

  private async openIncident(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { units: { include: { station: { select: { name: true, cityId: true, city: { select: { name: true } } } }, truck: { select: { callSign: true } } } } },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== 'OPEN') throw new BadRequestException('This incident is closed');
    return incident;
  }

  private async alarmLevels() {
    return (await this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } })).alarmLevels;
  }
}
