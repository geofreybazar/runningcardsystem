import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PERSON_SELECT } from '../auth/auth-user.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records one action. Pass the transaction (`db`) that makes the change, so the change and its entry are saved
   * together or not at all. `userId` is null only for a failed sign-in with an unknown account number.
   */
  log(
    userId: string | null,
    action: string,
    entity: string,
    entityId: string | number,
    changes?: object,
    { db = this.prisma, ip }: { db?: Pick<PrismaService, 'auditLog'>; ip?: string } = {},
  ) {
    return db.auditLog.create({ data: { userId, action, entity, entityId: String(entityId), changes, ip } });
  }

  list({ entity, take = 100, skip = 0 }: { entity?: string; take?: number; skip?: number }) {
    return this.prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: { user: { select: PERSON_SELECT } },
    });
  }
}
