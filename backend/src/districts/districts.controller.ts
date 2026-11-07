import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Put } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { AuthorizationService } from '@nestjs/authorization';
import { z } from 'zod';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { lat, lng } from '../stations/stations.dto.js';

const locationSchema = z.strictObject({ lat, lng });

@Controller()
@Can(AccessPolicy, 'operate')
export class DistrictsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
    private readonly audit: AuditService,
  ) {}

  /** The BFP NCR structure: districts and their cities (FD1/FD5 have a single city each). */
  @Get('districts')
  districts() {
    return this.prisma.fireDistrict.findMany({
      orderBy: { code: 'asc' },
      include: { cities: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
    });
  }

  @Get('cities/:id/barangays')
  barangays(@Param('id', ParseIntPipe) cityId: number) {
    return this.prisma.barangay.findMany({
      where: { cityId },
      select: { id: true, name: true, lat: true, lng: true },
      orderBy: { id: 'asc' }, // seed order keeps "Barangay 1, 2, 3…" numeric
    });
  }

  /**
   * Any operator may save the first pin (from geocoding when the barangay is first picked);
   * correcting an existing pin is an Operations job for that district.
   */
  @Put('barangays/:id/location')
  async setLocation(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body({ schema: locationSchema }) { lat, lng }: z.infer<typeof locationSchema>) {
    const barangay = await this.prisma.barangay.findUnique({ where: { id }, });
    if (!barangay) throw new NotFoundException('Barangay not found');
    const first = barangay.lat === null;
    if (!first) await this.authz.authorize(AccessPolicy, 'editCity', user, barangay.cityId);
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.barangay.update({ where: { id }, data: { lat, lng }, select: { id: true, name: true, lat: true, lng: true } });
      // The first pin comes from geocoding when a barangay is first picked; later ones are corrections.
      const changes = first ? { name: barangay.name, to: { lat, lng } } : { name: barangay.name, from: { lat: barangay.lat, lng: barangay.lng }, to: { lat, lng } };
      await this.audit.log(user.id, first ? 'SET_PIN' : 'UPDATE', 'Barangay', id, changes, { db: tx });
      return saved;
    });
  }
}
