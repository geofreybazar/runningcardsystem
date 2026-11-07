import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { PERSON_SELECT, type AuthUser } from '../auth/auth-user.js';
import type { NotificationType } from '../generated/prisma/enums.js';

type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];
/** A unit moved in this step. */
export type StepUnit = { station: { name: string; cityId: number | null; city: { name: string } | null }; truck: { callSign: string } };
type NoteUnit = { station: string; callSign: string; cityId: number | null; city: string | null };

const INCLUDE = {
  incident: { select: { locationLabel: true, status: true, city: { select: { id: true, name: true } } } },
  actor: { select: PERSON_SELECT },
} as const;

/** Offices see notifications naming a city in their area; the Regional office (area = all NCR) sees all. */
const visibleTo = (user: AuthUser) => (user.areaCityIds === null ? {} : { cityIds: { hasSome: user.areaCityIds } });

@Injectable()
export class NotificationsService {
  /**
   * Notifications as they are committed; each SSE connection filters for its own area.
   * shortcut: in-process only, so every API instance must be the same process; use Postgres LISTEN/NOTIFY when scaling out.
   */
  readonly events = new Subject<Awaited<ReturnType<NotificationsService['byIds']>>[number]>();

  constructor(private readonly prisma: PrismaService) {}

  isFor(user: AuthUser, n: { cityIds: number[] }) {
    return user.areaCityIds === null || n.cityIds.some((c) => user.areaCityIds!.includes(c));
  }

  /** What one account sees: only the trucks from its own area (Regional: all of them). */
  forUser<T extends { units: unknown }>(user: AuthUser, n: T) {
    const units = n.units as NoteUnit[];
    return { ...n, units: user.areaCityIds === null ? units : units.filter((u) => u.cityId !== null && user.areaCityIds!.includes(u.cityId)) };
  }

  /**
   * Inside the incident transaction: one notification for this step, addressed to every involved city (the fire's
   * city, cities with a truck on the incident, cities with a station on its running card). Returns its id to publish after commit.
   */
  async record(tx: Tx, incidentId: string, type: NotificationType, alarmLevel: string, actorId: string, stepUnits: StepUnit[]) {
    const incident = await tx.incident.findUniqueOrThrow({
      where: { id: incidentId },
      select: { cityId: true, runningCard: true, units: { select: { station: { select: { cityId: true } } } } },
    });
    const cardStationIds = (incident.runningCard as { stations: { id: number }[] }[]).flatMap((a) => a.stations.map((s) => s.id));
    const cardStations = await tx.station.findMany({ where: { id: { in: cardStationIds } }, select: { cityId: true } });
    const cityIds = [...new Set([incident.cityId, ...incident.units.map((u) => u.station.cityId), ...cardStations.map((s) => s.cityId)])].filter(
      (c) => c !== null,
    );
    const units: NoteUnit[] = stepUnits.map((u) => ({ station: u.station.name, callSign: u.truck.callSign, cityId: u.station.cityId, city: u.station.city?.name ?? null }));
    const { id } = await tx.notification.create({ data: { incidentId, cityIds, type, alarmLevel, actorId, units }, select: { id: true } });
    return [id];
  }

  /** After commit: push the new notifications to open streams. */
  async publish(ids: number[]) {
    for (const n of await this.byIds(ids)) this.events.next(n);
  }

  private byIds(ids: number[]) {
    return this.prisma.notification.findMany({ where: { id: { in: ids } }, include: INCLUDE, orderBy: { id: 'asc' } });
  }

  async list(user: AuthUser, take = 50) {
    const [rows, seenAt] = await Promise.all([
      this.prisma.notification.findMany({ where: visibleTo(user), include: INCLUDE, orderBy: { createdAt: 'desc' }, take }),
      this.seenAt(user),
    ]);
    // Unread first, newest first within each group.
    return rows
      .map((n) => ({ ...this.forUser(user, n), unread: !seenAt || n.createdAt > seenAt }))
      .sort((a, b) => Number(b.unread) - Number(a.unread));
  }

  async unreadCount(user: AuthUser) {
    const seenAt = await this.seenAt(user);
    const count = await this.prisma.notification.count({ where: { ...visibleTo(user), ...(seenAt && { createdAt: { gt: seenAt } }) } });
    return { count };
  }

  async markSeen(user: AuthUser) {
    await this.prisma.user.update({ where: { id: user.id }, data: { notificationsSeenAt: new Date() } });
  }

  private async seenAt(user: AuthUser) {
    return (await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { notificationsSeenAt: true } })).notificationsSeenAt;
  }
}
