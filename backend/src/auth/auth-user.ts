import type { Role } from '../generated/prisma/enums.js';

/** The signed-in user as every guard, policy and controller sees it (loaded fresh on each request). */
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  districtId: number | null;
  mustChangePassword: boolean;
}

export const AUTH_USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  role: true,
  districtId: true,
  mustChangePassword: true,
} as const;

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: AuthUser;
  }
}
