import { Policy, type PolicyBefore } from '@nestjs/authorization';
import type { AuthUser } from './auth-user.js';

const is = (user: AuthUser | null, ...roles: AuthUser['role'][]) => !!user && roles.includes(user.role);

/**
 * Who may do what. Area rules come from the user's office (see area.ts):
 * Operations maintain stations only in the one city their office runs; Radio Operators dispatch only for their own city;
 * Super Admin does anything.
 */
@Policy()
export class AccessPolicy implements PolicyBefore<AuthUser> {
  // Until the temporary password is changed, only @Can.Anyone() routes (me, change-password, logout) work.
  before(user: AuthUser | null) {
    if (user?.mustChangePassword) return false;
  }

  /** Read reference data, stations, running cards, and incidents in their area. */
  operate(user: AuthUser | null) {
    return !!user;
  }

  /** The running card is a dispatcher's tool: Radio Operators (any office) and Super Admin. */
  viewRunningCard(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN', 'RADIO_OPERATOR');
  }

  /** Route gate: Operations of a city office or of FD1/FD5. Fire District II-IV and Regional Operations only view. */
  editStations(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN') || (is(user, 'OPERATIONS') && user!.officeCityId !== null);
  }

  /** Stations, trucks and barangay pin corrections in this city: only the Operations office that runs it. */
  editCity(user: AuthUser | null, cityId: number | null) {
    if (is(user, 'SUPER_ADMIN')) return true;
    return is(user, 'OPERATIONS') && cityId !== null && user!.officeCityId === cityId;
  }

  /** Route gate for dispatch actions; the city is checked with dispatchIn. */
  dispatch(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN') || (is(user, 'RADIO_OPERATOR') && user!.dispatchCityId !== null);
  }

  dispatchIn(user: AuthUser | null, cityId: number | null) {
    return is(user, 'SUPER_ADMIN') || (is(user, 'RADIO_OPERATOR') && cityId !== null && user!.dispatchCityId === cityId);
  }

  /** Special deployments (ASEAN, SONA, …): the Regional Operations office, which can send trucks from any city. */
  manageDeployments(user: AuthUser | null) {
    return is(user, 'SUPER_ADMIN') || (is(user, 'OPERATIONS') && user!.officeLevel === 'REGIONAL');
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
