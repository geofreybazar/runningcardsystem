import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CityDirectory } from '../geo/city-directory.service.js';
import { AUTH_USER_SELECT, type AuthUser } from './auth-user.js';
import { areaCityIds, dispatchCityId, officeCityId } from './area.js';

/** Loads an active user with their office's area worked out. */
@Injectable()
export class UserLoader {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cities: CityDirectory,
  ) {}

  async load(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findFirst({ where: { id, isActive: true, deletedAt: null }, select: AUTH_USER_SELECT });
    if (!user) return null;
    const districtCities = user.districtId ? await this.cities.ofDistrict(user.districtId) : [];
    return {
      ...user,
      areaCityIds: areaCityIds(user, districtCities),
      dispatchCityId: dispatchCityId(user, districtCities),
      officeCityId: officeCityId(user, districtCities),
    };
  }
}
