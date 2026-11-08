import { ConflictException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CityDirectory } from '../geo/city-directory.service.js';
import { AuthorizationService } from '@nestjs/authorization';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import type { CreateStationDto, CreateTruckDto, UpdateStationDto, UpdateTruckDto } from './stations.dto.js';

const STATION_INCLUDE = {
  district: { select: { id: true, code: true, name: true, color: true } },
  city: { select: { id: true, name: true } },
  trucks: {
    where: { isActive: true },
    orderBy: { id: 'asc' },
    // The special deployment a DEPLOYED truck is on.
    include: { deploymentUnits: { where: { releasedAt: null }, select: { deployment: { select: { id: true, name: true } } }, take: 1 } },
  },
} as const;

/** A truck on a special deployment is managed by the deployment until Regional Operations releases it. */
function assertNotDeployed(truck: { status: string }) {
  if (truck.status === 'DEPLOYED') throw new ConflictException('On special deployment: Regional Operations releases it');
}

@Injectable()
export class StationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authz: AuthorizationService,
    private readonly cities: CityDirectory,
  ) {}

  list(districtId?: number, cityId?: number) {
    return this.prisma.station.findMany({
      where: { isActive: true, ...(districtId && { districtId }), ...(cityId && { cityId }) },
      include: STATION_INCLUDE,
      orderBy: [{ districtId: 'asc' }, { name: 'asc' }],
    });
  }

  async create(user: AuthUser, dto: CreateStationDto) {
    const city = await this.city(dto.cityId);
    await this.authz.authorize(AccessPolicy, 'editCity', user, city.id);
    return this.prisma.$transaction(async (tx) => {
      const station = await tx.station.create({
        data: {
          name: dto.name,
          lat: dto.lat,
          lng: dto.lng,
          districtId: city.districtId,
          cityId: city.id,
          address: dto.address,
          contactNumber: dto.contactNumber,
        },
        include: STATION_INCLUDE,
      });
      await this.audit.log(user.id, 'CREATE', 'Station', station.id, { name: station.name, districtId: station.districtId }, { db: tx });
      return station;
    });
  }

  async update(user: AuthUser, id: number, dto: UpdateStationDto) {
    const station = await this.findStation(id);
    await this.authz.authorize(AccessPolicy, 'editCity', user, station.cityId);
    // Moving a station to another city needs rights there too.
    const city = dto.cityId === undefined || dto.cityId === station.cityId ? null : await this.city(dto.cityId);
    if (city) await this.authz.authorize(AccessPolicy, 'editCity', user, city.id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.station.update({
        where: { id },
        data: {
          name: dto.name,
          lat: dto.lat,
          lng: dto.lng,
          ...(city && { cityId: city.id, districtId: city.districtId }),
          address: dto.address,
          contactNumber: dto.contactNumber,
          isActive: dto.isActive,
        },
        include: STATION_INCLUDE,
      });
      await this.audit.log(user.id, dto.isActive === false ? 'DEACTIVATE' : 'UPDATE', 'Station', id, dto, { db: tx });
      return updated;
    });
  }

  async addTruck(user: AuthUser, stationId: number, dto: CreateTruckDto) {
    const station = await this.findStation(stationId);
    await this.authz.authorize(AccessPolicy, 'editCity', user, station.cityId);
    return this.prisma.$transaction(async (tx) => {
      const truck = await tx.truck.create({
        data: {
          stationId,
          callSign: dto.callSign,
          plateNumber: dto.plateNumber,
          type: dto.type,
          waterCapacityLiters: dto.waterCapacityLiters,
          ownership: dto.ownership,
        },
      });
      await this.audit.log(user.id, 'CREATE', 'Truck', truck.id, { callSign: truck.callSign, stationId }, { db: tx });
      return truck;
    });
  }

  async updateTruck(user: AuthUser, id: number, dto: UpdateTruckDto) {
    const truck = await this.findTruck(id);
    await this.authz.authorize(AccessPolicy, 'editCity', user, truck.station.cityId);
    if (dto.status) assertNotDeployed(truck);
    return this.prisma.$transaction(async (tx) => {
      // Status changes are conditional, so a truck claimed by a deployment meanwhile keeps DEPLOYED.
      if (dto.status) {
        const { count } = await tx.truck.updateMany({ where: { id, status: { not: 'DEPLOYED' } }, data: { status: dto.status } });
        if (count === 0) assertNotDeployed({ status: 'DEPLOYED' });
      }
      const updated = await tx.truck.update({
        where: { id },
        data: {
          callSign: dto.callSign,
          plateNumber: dto.plateNumber,
          type: dto.type,
          waterCapacityLiters: dto.waterCapacityLiters,
          ownership: dto.ownership,
        },
      });
      await this.audit.log(user.id, dto.status && Object.keys(dto).length === 1 ? 'STATUS' : 'UPDATE', 'Truck', id, dto, { db: tx });
      return updated;
    });
  }

  /** Retire a truck; it stays in incident history. */
  async removeTruck(user: AuthUser, id: number) {
    const truck = await this.findTruck(id);
    await this.authz.authorize(AccessPolicy, 'editCity', user, truck.station.cityId);
    assertNotDeployed(truck);
    await this.prisma.$transaction(async (tx) => {
      await tx.truck.update({ where: { id }, data: { isActive: false } });
      await this.audit.log(user.id, 'DELETE', 'Truck', id, { callSign: truck.callSign }, { db: tx });
    });
  }

  private async findStation(id: number) {
    const station = await this.prisma.station.findFirst({ where: { id, isActive: true } });
    if (!station) throw new NotFoundException('Station not found');
    return station;
  }

  private async findTruck(id: number) {
    const truck = await this.prisma.truck.findFirst({ where: { id, isActive: true }, include: { station: true } });
    if (!truck) throw new NotFoundException('Truck not found');
    return truck;
  }

  private async city(id: number) {
    const city = await this.cities.get(id);
    if (!city) throw new BadRequestException('Unknown city');
    return city;
  }

}
