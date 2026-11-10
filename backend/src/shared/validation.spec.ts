import { z } from 'zod';
import * as shared from './validation.js';
import { DeploymentStatus, OfficeLevel, Rank, Role, TruckOwnership, TruckStatus, TruckType } from '../generated/prisma/enums.js';
import { DEPLOYMENT_STATUSES, OFFICE_LEVELS, RANKS, ROLES, TRUCK_OWNERSHIPS, RUNNING_CARD_TRUCK_TYPES, SPECIAL_TRUCK_TYPES, TRUCK_STATUSES, TRUCK_TYPES, accountNumber, deploymentFormSchema, userFormSchema } from './validation.js';

// The shared lists can't import Prisma (the frontend bundles them), so check them against the schema here.
describe('shared validation', () => {
  it('enum lists match the database enums', () => {
    expect(RANKS).toEqual(Object.values(Rank)); // same order: lowest to highest
    expect([...ROLES].sort()).toEqual(Object.values(Role).sort());
    expect([...OFFICE_LEVELS].sort()).toEqual(Object.values(OfficeLevel).sort());
    expect([...TRUCK_OWNERSHIPS].sort()).toEqual(Object.values(TruckOwnership).sort());
    expect([...TRUCK_STATUSES, 'DEPLOYED'].sort()).toEqual(Object.values(TruckStatus).sort()); // DEPLOYED: set by deployments only
    expect([...DEPLOYMENT_STATUSES].sort()).toEqual(Object.values(DeploymentStatus).sort());
    // Only the types still offered; the database keeps AMBULANCE and RESCUE for older records.
    expect([...TRUCK_TYPES].sort()).toEqual(Object.values(TruckType).sort());
    // Every type is either a running-card type or a special unit, never both.
    expect([...RUNNING_CARD_TRUCK_TYPES, ...SPECIAL_TRUCK_TYPES].sort()).toEqual([...TRUCK_TYPES].sort());
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

  it('deployment form: dates in order', () => {
    const base = { name: 'SONA 2026', locationLabel: 'Batasang Pambansa', lat: 14.69, lng: 121.09, startsAt: '2026-07-27T06:00:00Z' };
    expect(deploymentFormSchema.safeParse(base).success).toBe(true);
    expect(deploymentFormSchema.safeParse({ ...base, endsAt: '2026-07-27T18:00:00Z' }).success).toBe(true);
    expect(deploymentFormSchema.safeParse({ ...base, endsAt: '2026-07-26T18:00:00Z' }).error?.issues.map((i) => i.message)).toEqual(['Ends before it starts']);
  });

  it('every schema converts to JSON Schema (Swagger does this at startup in development)', () => {
    const schemas = Object.entries(shared).filter(([, v]) => v instanceof z.ZodType);
    expect(schemas.length).toBeGreaterThan(5);
    for (const [name, schema] of schemas) expect(() => z.toJSONSchema(schema as z.ZodType, { io: 'input' }), name).not.toThrow();
  });
});
