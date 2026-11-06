import { Injectable } from '@nestjs/common';
import { AuthenticationStorage, type RefreshTokenRecord, type RefreshTokenStore } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';

// shortcut: expired rows are never purged; add a scheduled cleanup if the table grows large.
@Injectable()
export class PrismaRefreshTokenStore implements RefreshTokenStore {
  constructor(
    private readonly prisma: PrismaService,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({ refreshTokens: this });
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (!row) return undefined;
    return {
      id: row.id,
      familyId: row.familyId,
      userId: row.userId,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      familyExpiresAt: row.familyExpiresAt,
      usedAt: row.usedAt ?? undefined,
      claims: (row.claims as Record<string, unknown> | null) ?? undefined,
    };
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { ...record, claims: record.claims as object | undefined },
    });
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    // Conditional update: only one concurrent refresh can win.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: at },
    });
    return count === 1;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    const token = await this.prisma.refreshToken.findFirst({ where: { familyId } });
    await this.prisma.revokedRefreshFamily.createMany({
      data: [{ familyId, familyExpiresAt: token?.familyExpiresAt ?? new Date() }],
      skipDuplicates: true,
    });
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    return !!(await this.prisma.revokedRefreshFamily.findUnique({ where: { familyId } }));
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    const families = await this.prisma.refreshToken.findMany({
      where: { userId },
      distinct: ['familyId'],
      select: { familyId: true, familyExpiresAt: true },
    });
    await this.prisma.revokedRefreshFamily.createMany({ data: families, skipDuplicates: true });
  }
}
