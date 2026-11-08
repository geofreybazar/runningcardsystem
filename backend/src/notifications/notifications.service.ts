import { Injectable, NotFoundException } from '@nestjs/common';
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
  deployment: { select: { name: true, locationLabel: true, status: true } },
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

  /**
   * Inside the deployment transaction: one notification for trucks assigned to or released from a special deployment,
   * addressed to the cities those trucks belong to (the Regional office sees every notification anyway).
   */
  async recordDeployment(tx: Tx, deploymentId: string, type: 'DEPLOYMENT_ASSIGNED' | 'DEPLOYMENT_RELEASED', actorId: string, stepUnits: StepUnit[]) {
    if (stepUnits.length === 0) return [];
    const units: NoteUnit[] = stepUnits.map((u) => ({ station: u.station.name, callSign: u.truck.callSign, cityId: u.station.cityId, city: u.station.city?.name ?? null }));
    const cityIds = [...new Set(units.map((u) => u.cityId))].filter((c) => c !== null);
    const { id } = await tx.notification.create({ data: { deploymentId, cityIds, type, actorId, units }, select: { id: true } });
    return [id];
  }

  /** After commit: push the new notifications to open streams. */
  async publish(ids: number[]) {
    for (const n of await this.byIds(ids)) this.events.next(n);
  }

  private byIds(ids: number[]) {
    return this.prisma.notification.findMany({ where: { id: { in: ids } }, include: INCLUDE, orderBy: { id: 'asc' } });
  }

  /** Newest first; a page shorter than `take` is the last one. */
  async list(user: AuthUser, take = 20, before?: number) {
    const [rows, isUnread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { ...visibleTo(user), ...(before && { id: { lt: before } }) },
        include: INCLUDE,
        orderBy: { id: 'desc' },
        take,
      }),
      this.unreadTest(user),
    ]);
    return rows.map((n) => ({ ...this.forUser(user, n), unread: isUnread(n) }));
  }

  async unreadCount(user: AuthUser) {
    const { notificationsSeenId } = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { notificationsSeenId: true } });
    // shortcut: loads everything newer than the last "seen all" to drop per-incident views; fine while that stays small, else count in SQL.
    const [rows, isUnread] = await Promise.all([
      this.prisma.notification.findMany({ where: { ...visibleTo(user), id: { gt: notificationsSeenId } }, select: { id: true, incidentId: true } }),
      this.unreadTest(user),
    ]);
    return { count: rows.filter(isUnread).length };
  }

  /**
   * Without incidentId: everything so far is read. With it: that incident's notifications are read (the user is viewing it).
   * "So far" is the highest notification id now, not a time, so a clock step can't make a new notification look old.
   */
  async markSeen(user: AuthUser, incidentId?: string) {
    const seenId = (await this.prisma.notification.aggregate({ _max: { id: true } }))._max.id ?? 0;
    if (!incidentId) {
      await this.prisma.user.update({ where: { id: user.id }, data: { notificationsSeenId: seenId } });
      return;
    }
    if (!(await this.prisma.incident.count({ where: { id: incidentId } }))) throw new NotFoundException('Incident not found');
    await this.prisma.incidentView.upsert({
      where: { userId_incidentId: { userId: user.id, incidentId } },
      create: { userId: user.id, incidentId, seenId },
      update: { seenId },
    });
  }

  /** Unread = a higher id than the last "seen all" and than the account's last view of that incident. */
  private async unreadTest(user: AuthUser) {
    const { notificationsSeenId, incidentViews } = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { notificationsSeenId: true, incidentViews: { select: { incidentId: true, seenId: true } } },
    });
    const viewed = new Map(incidentViews.map((v) => [v.incidentId, v.seenId]));
    return (n: { id: number; incidentId: string | null }) => n.id > notificationsSeenId && n.id > ((n.incidentId && viewed.get(n.incidentId)) || 0);
  }
}
