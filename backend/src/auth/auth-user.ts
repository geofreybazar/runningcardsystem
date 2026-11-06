import type { OfficeLevel, Role } from '../generated/prisma/enums.js';

/** The signed-in user as every guard, policy and controller sees it (loaded fresh on each request). */
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  officeLevel: OfficeLevel;
  districtId: number | null;
  cityId: number | null;
  mustChangePassword: boolean;
  /** Cities this office is responsible for; null = all of NCR. */
  areaCityIds: number[] | null;
  /** City whose fires this account dispatches; null = cannot dispatch (Super Admin dispatches anywhere). */
  dispatchCityId: number | null;
}

export const AUTH_USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  role: true,
  officeLevel: true,
  districtId: true,
  cityId: true,
  mustChangePassword: true,
} as const;

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: AuthUser;
  }
}
