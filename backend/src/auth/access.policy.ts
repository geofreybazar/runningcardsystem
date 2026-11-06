import { Policy, type PolicyBefore } from '@nestjs/authorization';
import type { AuthUser } from './auth-user.js';

const is = (user: AuthUser | null, ...roles: AuthUser['role'][]) => !!user && roles.includes(user.role);

/** Who may do what. Record-level checks (own district, which roles an admin may manage) live in the services. */
@Policy()
export class AccessPolicy implements PolicyBefore<AuthUser> {
  // Until the temporary password is changed, only @Can.Anyone() routes (me, change-password, logout) work.
  before(user: AuthUser | null) {
    if (user?.mustChangePassword) return false;
  }

  /** Read reference data, generate running cards, dispatch and manage incidents. */
  operate(user: AuthUser | null) {
    return !!user;
  }

  editStations(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN', 'OPERATIONS');
  }

  /** Operations users edit only their own fire district. */
  editDistrict(user: AuthUser | null, districtId: number) {
    return is(user, 'SUPER_ADMIN') || (is(user, 'OPERATIONS') && user!.districtId === districtId);
  }

  manageUsers(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN', 'ADMIN');
  }

  viewAuditLog(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN', 'ADMIN');
  }

  manageSettings(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN');
  }
}
