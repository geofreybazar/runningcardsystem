import { OfficeLevel, Rank, Role, TruckOwnership, TruckStatus, TruckType } from '../generated/prisma/enums.js';
import { OFFICE_LEVELS, RANKS, ROLES, TRUCK_OWNERSHIPS, TRUCK_STATUSES, TRUCK_TYPES, accountNumber, userFormSchema } from './validation.js';

// The shared lists can't import Prisma (the frontend bundles them), so check them against the schema here.
describe('shared validation', () => {
  it('enum lists match the database enums', () => {
    expect(RANKS).toEqual(Object.values(Rank)); // same order: lowest to highest
    expect([...ROLES].sort()).toEqual(Object.values(Role).sort());
    expect([...OFFICE_LEVELS].sort()).toEqual(Object.values(OfficeLevel).sort());
    expect([...TRUCK_OWNERSHIPS].sort()).toEqual(Object.values(TruckOwnership).sort());
    expect([...TRUCK_STATUSES].sort()).toEqual(Object.values(TruckStatus).sort());
    // Only the types still offered; the database keeps AMBULANCE and RESCUE for older records.
    expect(TRUCK_TYPES.every((t) => (Object.values(TruckType) as string[]).includes(t))).toBe(true);
    expect([...TRUCK_TYPES].sort()).toEqual(Object.values(TruckType).filter((t) => t !== 'AMBULANCE' && t !== 'RESCUE').sort());
  });

  it('account numbers', () => {
    expect(accountNumber.parse(' b13084 ')).toBe('B13084');
    for (const bad of ['13084', 'B12', 'BFPX1234', 'B-13084']) expect(accountNumber.safeParse(bad).success).toBe(false);
  });

  it('user form: rank unless Super Admin, office choices, and messages per field', () => {
    const base = { firstName: 'Juan', lastName: 'Cruz', role: 'RADIO_OPERATOR', officeLevel: 'CITY', cityId: 3 };
    const issues = (u: object) => (userFormSchema.safeParse(u).error?.issues ?? []).map((i) => `${i.path.join('.')}: ${i.message}`);
    expect(issues({ ...base, rank: 'FO1' })).toEqual([]);
    expect(issues(base)).toEqual(['rank: Choose a rank']);
    expect(issues({ ...base, role: 'SUPER_ADMIN', officeLevel: 'REGIONAL', cityId: null })).toEqual([]);
    expect(issues({ ...base, rank: 'FO1', cityId: null })).toEqual(['cityId: Choose a city']);
    expect(issues({ ...base, rank: 'FO1', firstName: ' ', accountNumber: 'x' })).toEqual(['firstName: Required', 'accountNumber: Use 1-3 letters then 4-8 digits, e.g. B13084']);
  });
});
