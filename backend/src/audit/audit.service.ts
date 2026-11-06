import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(userId: string, action: string, entity: string, entityId: string | number, changes?: object) {
    return this.prisma.auditLog.create({
      data: { userId, action, entity, entityId: String(entityId), changes },
    });
  }

  list({ entity, take = 100, skip = 0 }: { entity?: string; take?: number; skip?: number }) {
    return this.prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: { user: { select: { username: true, fullName: true } } },
    });
  }
}
