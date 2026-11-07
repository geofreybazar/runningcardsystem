import { BadRequestException, Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

const settingsSchema = z.strictObject({
  stationsPerAlarm: z.int().min(1).max(20),
  maxDistanceKm: z.number().min(1).max(200),
  alarmLevels: z.array(z.string().min(1).max(40)).min(1).max(30),
});

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Can(AccessPolicy, 'operate')
  get() {
    return this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
  }

  @Put()
  @Can(AccessPolicy, 'manageSettings')
  async update(@CurrentUser() user: AuthUser, @Body({ schema: settingsSchema }) dto: z.infer<typeof settingsSchema>) {
    const alarmLevels = dto.alarmLevels.map((l) => l.trim());
    if (new Set(alarmLevels).size !== alarmLevels.length) throw new BadRequestException('Alarm level names must be unique');
    // Open incidents refer to alarm levels by position, so the list can't shrink below the highest one in use.
    const highest = await this.prisma.incident.aggregate({ where: { status: 'OPEN' }, _max: { alarmIndex: true } });
    if ((highest._max.alarmIndex ?? -1) >= alarmLevels.length) {
      throw new BadRequestException('An open incident is at an alarm level you are removing. Close it first.');
    }
    const before = await this.get();
    const saved = await this.prisma.settings.update({
      where: { id: 1 },
      data: { stationsPerAlarm: dto.stationsPerAlarm, maxDistanceKm: dto.maxDistanceKm, alarmLevels },
    });
    await this.audit.log(user.id, 'UPDATE', 'Settings', 1, { before, after: saved });
    return saved;
  }
}
