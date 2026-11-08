import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PERSON_SELECT, type AuthUser } from '../auth/auth-user.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CreateDeploymentDto, TruckPostDto, UpdateDeploymentDto } from './deployments.dto.js';

type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

/** What a notification and the audit log need about a moved truck. */
const STEP_UNIT = { station: { select: { name: true, cityId: true, city: { select: { name: true } } } }, truck: { select: { callSign: true } } } as const;

const DETAIL_INCLUDE = {
  createdBy: { select: PERSON_SELECT },
  endedBy: { select: PERSON_SELECT },
  units: {
    orderBy: { id: 'asc' },
    include: {
      station: { select: { id: true, name: true, city: { select: { id: true, name: true } }, district: { select: { code: true, color: true } } } },
      truck: { select: { id: true, callSign: true, type: true, plateNumber: true, status: true } },
      assignedBy: { select: PERSON_SELECT },
      releasedBy: { select: PERSON_SELECT },
    },
  },
} as const;

const callSigns = (units: { truck: { callSign: string } }[]) => units.map((u) => u.truck.callSign);

/**
 * Special deployments (ASEAN, SONA, …): Regional Operations sends trucks from any city to one event. An assigned truck
 * is DEPLOYED, so the running card and dispatch (which take only AVAILABLE trucks) skip it until it is released.
 */
@Injectable()
export class DeploymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Newest first; everyone may see them, so offices know where their trucks are. */
  list(status?: 'ACTIVE' | 'ENDED') {
    return this.prisma.specialDeployment.findMany({
      where: { deletedAt: null, ...(status && { status }) },
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: PERSON_SELECT },
        _count: { select: { units: { where: { releasedAt: null } } } },
      },
    });
  }

  async get(id: string) {
    const deployment = await this.prisma.specialDeployment.findFirst({ where: { id, deletedAt: null }, include: DETAIL_INCLUDE });
    if (!deployment) throw new NotFoundException('Deployment not found');
    return deployment;
  }

  async create(user: AuthUser, dto: CreateDeploymentDto) {
    const { truckIds, ...fields } = dto;
    const { id, notified } = await this.prisma.$transaction(async (tx) => {
      const deployment = await tx.specialDeployment.create({
        data: {
          name: fields.name,
          locationLabel: fields.locationLabel,
          lat: fields.lat,
          lng: fields.lng,
          startsAt: new Date(fields.startsAt),
          endsAt: fields.endsAt ? new Date(fields.endsAt) : null,
          notes: fields.notes ?? null,
          createdById: user.id,
        },
      });
      await this.audit.log(user.id, 'CREATE', 'Deployment', deployment.id, { name: fields.name, locationLabel: fields.locationLabel }, { db: tx });
      return { id: deployment.id, notified: await this.assignTrucks(tx, user, deployment.id, truckIds) };
    });
    await this.notifications.publish(notified);
    return this.get(id);
  }

  async update(user: AuthUser, id: string, dto: UpdateDeploymentDto) {
    const current = await this.active(id);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
    const endsAt = dto.endsAt === undefined ? current.endsAt : dto.endsAt && new Date(dto.endsAt);
    if (endsAt && endsAt < startsAt) throw new BadRequestException('Ends before it starts');
    await this.prisma.$transaction(async (tx) => {
      await tx.specialDeployment.update({
        where: { id },
        data: { name: dto.name, locationLabel: dto.locationLabel, lat: dto.lat, lng: dto.lng, startsAt: dto.startsAt && startsAt, endsAt: dto.endsAt === undefined ? undefined : endsAt, notes: dto.notes },
      });
      await this.audit.log(user.id, 'UPDATE', 'Deployment', id, dto, { db: tx });
    });
    return this.get(id);
  }

  async assign(user: AuthUser, id: string, truckIds: number[]) {
    await this.active(id);
    const notified = await this.prisma.$transaction((tx) => this.assignTrucks(tx, user, id, truckIds));
    await this.notifications.publish(notified);
    return this.get(id);
  }

  /** Where one truck stands within the event, e.g. Engine A at Quiapo Church. Changeable while it is there. */
  async setPost(user: AuthUser, id: string, truckId: number, dto: TruckPostDto) {
    await this.active(id);
    const unit = await this.prisma.deploymentUnit.findFirst({ where: { deploymentId: id, truckId, releasedAt: null }, include: STEP_UNIT });
    if (!unit) throw new NotFoundException('That truck is not on this deployment');
    await this.prisma.$transaction(async (tx) => {
      await tx.deploymentUnit.update({ where: { id: unit.id }, data: { postLabel: dto.postLabel, postLat: dto.lat, postLng: dto.lng } });
      await this.audit.log(user.id, 'SET_POST', 'Deployment', id, { truck: unit.truck.callSign, post: dto.postLabel }, { db: tx });
    });
    return this.get(id);
  }

  /** One truck back to its station: DEPLOYED → AVAILABLE. */
  async release(user: AuthUser, id: string, truckId: number) {
    await this.active(id);
    const unit = await this.prisma.deploymentUnit.findFirst({ where: { deploymentId: id, truckId, releasedAt: null }, include: STEP_UNIT });
    if (!unit) throw new NotFoundException('That truck is not on this deployment');
    const notified = await this.prisma.$transaction(async (tx) => {
      await this.releaseUnits(tx, user, [unit]);
      await this.audit.log(user.id, 'RELEASE', 'Deployment', id, { trucks: callSigns([unit]) }, { db: tx });
      return this.notifications.recordDeployment(tx, id, 'DEPLOYMENT_RELEASED', user.id, [unit]);
    });
    await this.notifications.publish(notified);
    return this.get(id);
  }

  /** The event is over: every truck still there goes back, and the deployment is closed. */
  async end(user: AuthUser, id: string) {
    await this.active(id);
    const notified = await this.prisma.$transaction(async (tx) => {
      const units = await tx.deploymentUnit.findMany({ where: { deploymentId: id, releasedAt: null }, include: STEP_UNIT });
      await this.releaseUnits(tx, user, units);
      // Conditional, so two people ending it at once release the trucks once.
      const { count } = await tx.specialDeployment.updateMany({
        where: { id, status: 'ACTIVE' },
        data: { status: 'ENDED', endedAt: new Date(), endedById: user.id },
      });
      if (count === 0) throw new ConflictException('This deployment has already ended');
      await this.audit.log(user.id, 'END', 'Deployment', id, { released: callSigns(units) }, { db: tx });
      return this.notifications.recordDeployment(tx, id, 'DEPLOYMENT_RELEASED', user.id, units);
    });
    await this.notifications.publish(notified);
    return this.get(id);
  }

  /**
   * Removes a deployment from the app (soft delete: the audit log and notifications keep it). Trucks still there go back
   * to their stations first, so none is left DEPLOYED on a deployment nobody can see.
   */
  async remove(user: AuthUser, id: string) {
    const deployment = await this.prisma.specialDeployment.findFirst({ where: { id, deletedAt: null } });
    if (!deployment) throw new NotFoundException('Deployment not found');
    const notified = await this.prisma.$transaction(async (tx) => {
      const units = await tx.deploymentUnit.findMany({ where: { deploymentId: id, releasedAt: null }, include: STEP_UNIT });
      await this.releaseUnits(tx, user, units);
      // Conditional, so two people deleting it at once release the trucks once.
      const { count } = await tx.specialDeployment.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date(), ...(deployment.status === 'ACTIVE' && { status: 'ENDED', endedAt: new Date(), endedById: user.id }) },
      });
      if (count === 0) throw new NotFoundException('Deployment not found');
      await this.audit.log(user.id, 'DELETE', 'Deployment', id, { name: deployment.name, released: callSigns(units) }, { db: tx });
      return this.notifications.recordDeployment(tx, id, 'DEPLOYMENT_RELEASED', user.id, units);
    });
    await this.notifications.publish(notified);
  }

  /**
   * Claims each truck with a conditional update (AVAILABLE → DEPLOYED), so a truck can't be on a fire and a deployment
   * at once. Any truck that isn't available fails the whole step: nothing half-assigned.
   */
  private async assignTrucks(tx: Tx, user: AuthUser, deploymentId: string, truckIds: number[]) {
    const ids = [...new Set(truckIds)];
    if (ids.length === 0) return [];
    const assigned = [];
    for (const truckId of ids) {
      const truck = await tx.truck.findFirst({ where: { id: truckId, isActive: true, station: { isActive: true } }, select: { callSign: true, status: true, stationId: true } });
      if (!truck) throw new NotFoundException(`Truck ${truckId} not found`);
      const { count } = await tx.truck.updateMany({ where: { id: truckId, status: 'AVAILABLE', isActive: true }, data: { status: 'DEPLOYED' } });
      if (count === 0) throw new ConflictException(`${truck.callSign} is not available (${truck.status.toLowerCase().replace(/_/g, ' ')})`);
      assigned.push(
        await tx.deploymentUnit.create({
          data: { deploymentId, truckId, stationId: truck.stationId, assignedById: user.id },
          include: STEP_UNIT,
        }),
      );
    }
    await this.audit.log(user.id, 'ASSIGN', 'Deployment', deploymentId, { trucks: callSigns(assigned) }, { db: tx });
    return this.notifications.recordDeployment(tx, deploymentId, 'DEPLOYMENT_ASSIGNED', user.id, assigned);
  }

  private async releaseUnits(tx: Tx, user: AuthUser, units: { id: number; truckId: number }[]) {
    if (units.length === 0) return;
    await tx.truck.updateMany({ where: { id: { in: units.map((u) => u.truckId) }, status: 'DEPLOYED' }, data: { status: 'AVAILABLE' } });
    await tx.deploymentUnit.updateMany({ where: { id: { in: units.map((u) => u.id) } }, data: { releasedAt: new Date(), releasedById: user.id } });
  }

  private async active(id: string) {
    const deployment = await this.prisma.specialDeployment.findFirst({ where: { id, deletedAt: null } });
    if (!deployment) throw new NotFoundException('Deployment not found');
    if (deployment.status !== 'ACTIVE') throw new BadRequestException('This deployment has ended');
    return deployment;
  }
}
