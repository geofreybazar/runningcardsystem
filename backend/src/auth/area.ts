import type { OfficeLevel, Role } from '../generated/prisma/enums.js';
import type { CityInfo } from '../geo/city-directory.service.js';

export interface Office {
  role: Role;
  officeLevel: OfficeLevel;
  districtId: number | null;
  cityId: number | null;
}

/** Which office levels each role may have. */
export const OFFICE_LEVELS: Record<Role, OfficeLevel[]> = {
  SUPER_ADMIN: ['REGIONAL'],
  ADMIN: ['REGIONAL'],
  OPERATIONS: ['DISTRICT', 'CITY'],
  RADIO_OPERATOR: ['REGIONAL', 'DISTRICT', 'CITY'],
};

/** Cities an office is responsible for; null means all of NCR. */
export function areaCityIds(office: Office, districtCities: CityInfo[]): number[] | null {
  if (office.officeLevel === 'CITY') return office.cityId ? [office.cityId] : [];
  if (office.officeLevel === 'DISTRICT') return districtCities.map((c) => c.id);
  return null;
}

/**
 * The city whose fires this office dispatches: a City office's city, or the one city of a district that acts as a city
 * (FD1 Manila, FD5 Quezon City). Other district offices and the Regional office only watch.
 */
export function dispatchCityId(office: Office, districtCities: CityInfo[]): number | null {
  if (office.role !== 'RADIO_OPERATOR') return null;
  if (office.officeLevel === 'CITY') return office.cityId;
  if (office.officeLevel === 'DISTRICT' && districtCities.length === 1) return districtCities[0].id;
  return null;
}
