import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { AccessPolicy } from '../auth/access.policy.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller()
@Can(AccessPolicy, 'operate')
export class DistrictsController {
  constructor(private readonly prisma: PrismaService) {}

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
}
