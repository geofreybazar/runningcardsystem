import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import type { CreateStationDto, CreateTruckDto, UpdateStationDto, UpdateTruckDto } from './stations.dto.js';

const STATION_INCLUDE = {
  district: { select: { id: true, code: true, name: true, color: true } },
  city: { select: { id: true, name: true } },
  trucks: { where: { isActive: true }, orderBy: { id: 'asc' } },
} as const;

@Injectable()
export class StationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authz: AuthorizationService,
  ) {}

  list(districtId?: number) {
    return this.prisma.station.findMany({
      where: { isActive: true, ...(districtId && { districtId }) },
      include: STATION_INCLUDE,
      orderBy: [{ districtId: 'asc' }, { name: 'asc' }],
    });
  }

  async create(user: AuthUser, dto: CreateStationDto) {
    await this.authz.authorize(AccessPolicy, 'editDistrict', user, dto.districtId);
    await this.assertCityInDistrict(dto.cityId, dto.districtId);
    const station = await this.prisma.station.create({
      data: {
        name: dto.name,
        lat: dto.lat,
        lng: dto.lng,
        districtId: dto.districtId,
        cityId: dto.cityId ?? null,
        address: dto.address,
        contactNumber: dto.contactNumber,
      },
      include: STATION_INCLUDE,
    });
    await this.audit.log(user.id, 'CREATE', 'Station', station.id, { name: station.name, districtId: station.districtId });
    return station;
  }

  async update(user: AuthUser, id: number, dto: UpdateStationDto) {
    const station = await this.findStation(id);
    await this.authz.authorize(AccessPolicy, 'editDistrict', user, station.districtId);
    const districtId = dto.districtId ?? station.districtId;
    // Moving a station to another district needs rights there too.
    if (districtId !== station.districtId) await this.authz.authorize(AccessPolicy, 'editDistrict', user, districtId);
    const cityId = dto.cityId === undefined ? (districtId === station.districtId ? station.cityId : null) : dto.cityId;
    await this.assertCityInDistrict(cityId, districtId);
    const updated = await this.prisma.station.update({
      where: { id },
      data: {
        name: dto.name,
        lat: dto.lat,
        lng: dto.lng,
        districtId,
        cityId,
        address: dto.address,
        contactNumber: dto.contactNumber,
        isActive: dto.isActive,
      },
      include: STATION_INCLUDE,
    });
    await this.audit.log(user.id, dto.isActive === false ? 'DEACTIVATE' : 'UPDATE', 'Station', id, dto);
    return updated;
  }

  async addTruck(user: AuthUser, stationId: number, dto: CreateTruckDto) {
    const station = await this.findStation(stationId);
    await this.authz.authorize(AccessPolicy, 'editDistrict', user, station.districtId);
    const truck = await this.prisma.truck.create({
      data: {
        stationId,
        callSign: dto.callSign,
        plateNumber: dto.plateNumber,
        type: dto.type,
        waterCapacityLiters: dto.waterCapacityLiters,
        ownership: dto.ownership,
      },
    });
    await this.audit.log(user.id, 'CREATE', 'Truck', truck.id, { callSign: truck.callSign, stationId });
    return truck;
  }

  async updateTruck(user: AuthUser, id: number, dto: UpdateTruckDto) {
    const truck = await this.findTruck(id);
    await this.authz.authorize(AccessPolicy, 'editDistrict', user, truck.station.districtId);
    const updated = await this.prisma.truck.update({
      where: { id },
      data: {
        callSign: dto.callSign,
        plateNumber: dto.plateNumber,
        type: dto.type,
        waterCapacityLiters: dto.waterCapacityLiters,
        ownership: dto.ownership,
        status: dto.status,
      },
    });
    await this.audit.log(user.id, dto.status && Object.keys(dto).length === 1 ? 'STATUS' : 'UPDATE', 'Truck', id, dto);
    return updated;
  }

  /** Retire a truck; it stays in incident history. */
  async removeTruck(user: AuthUser, id: number) {
    const truck = await this.findTruck(id);
    await this.authz.authorize(AccessPolicy, 'editDistrict', user, truck.station.districtId);
    await this.prisma.truck.update({ where: { id }, data: { isActive: false } });
    await this.audit.log(user.id, 'DELETE', 'Truck', id, { callSign: truck.callSign });
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

  private async assertCityInDistrict(cityId: number | null | undefined, districtId: number) {
    if (cityId == null) return;
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city || city.districtId !== districtId) throw new BadRequestException('That city is not in this fire district');
  }
}
