/**
 * Validation rules shared by the API (request bodies) and the web app (form errors before saving), so the two can't
 * drift. The frontend bundles this file through its `@shared` alias: import nothing here but zod.
 * Enum lists mirror the Prisma enums; validation.spec.ts fails if they differ.
 */
import { z } from 'zod';

export const RANKS = ['FO1', 'FO2', 'FO3', 'SFO1', 'SFO2', 'SFO3', 'SFO4', 'FINSP', 'FSINSP', 'FCINSP', 'FSUPT', 'FSSUPT', 'FCSUPT'] as const;
export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'RADIO_OPERATOR'] as const;
export const OFFICE_LEVELS = ['REGIONAL', 'DISTRICT', 'CITY'] as const;
export const TRUCK_TYPES = ['MINI_PUMPER', 'ENGINE', 'TANKER', 'LADDER', 'RESCUE_TRUCK', 'CSSR_TRUCK', 'AMBULANCE'] as const;
/** Types the running card (1st Alarm and raised alarms) sends. */
export const RUNNING_CARD_TRUCK_TYPES = ['MINI_PUMPER', 'ENGINE'] as const satisfies readonly (typeof TRUCK_TYPES)[number][];
/** Special units: never on the running card, sent only when the fire's city requests one on an incident. */
export const SPECIAL_TRUCK_TYPES = ['TANKER', 'LADDER', 'RESCUE_TRUCK', 'CSSR_TRUCK', 'AMBULANCE'] as const satisfies readonly (typeof TRUCK_TYPES)[number][];
export const TRUCK_OWNERSHIPS = ['BFP', 'LGU'] as const;
/** Statuses a station editor may set. DEPLOYED (special deployments) is set and cleared only by the deployment. */
export const TRUCK_STATUSES = ['AVAILABLE', 'RESPONDING', 'OUT_OF_SERVICE'] as const;
export const DEPLOYMENT_STATUSES = ['ACTIVE', 'ENDED'] as const;

const text = (max: number) => z.string().trim().min(1, 'Required').max(max, `At most ${max} characters`);
const optionalText = (max: number) => z.string().max(max, `At most ${max} characters`).nullable().optional();

/** BFP account number, e.g. B13084. Uppercased first, so b13084 is accepted and stored as B13084. */
export const accountNumber = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{1,3}\d{4,8}$/, 'Use 1-3 letters then 4-8 digits, e.g. B13084');

export const lat = z.number({ error: 'Place it on the map' }).min(-90).max(90);
export const lng = z.number({ error: 'Place it on the map' }).min(-180).max(180);

// --- Users --------------------------------------------------------------------------------------------------------

const userFields = {
  /** Required for every role except SUPER_ADMIN (see withUserRules; UsersService checks updates against the stored role). */
  rank: z.enum(RANKS, { error: 'Choose a rank' }).nullable().optional(),
  firstName: text(60),
  middleName: z.string().trim().max(60, 'At most 60 characters').transform((s) => s || null).nullable().optional(),
  lastName: text(60),
  accountNumber,
  role: z.enum(ROLES, { error: 'Choose a role' }),
  /** Defaults to REGIONAL. DISTRICT needs districtId; CITY needs cityId (the district follows from the city). */
  officeLevel: z.enum(OFFICE_LEVELS).optional(),
  districtId: z.int().nullable().optional(),
  cityId: z.int().nullable().optional(),
};

type UserShape = { role?: string; rank?: string | null; officeLevel?: string; districtId?: number | null; cityId?: number | null };

/** Rules across fields, for a full user (create, and the edit form, which sends every field). */
const withUserRules = <T extends z.ZodType<UserShape>>(schema: T) =>
  schema.superRefine((u, ctx) => {
    if (u.role !== 'SUPER_ADMIN' && !u.rank) ctx.addIssue({ code: 'custom', path: ['rank'], message: 'Choose a rank' });
    if (u.officeLevel === 'DISTRICT' && !u.districtId) ctx.addIssue({ code: 'custom', path: ['districtId'], message: 'Choose a fire district' });
    if (u.officeLevel === 'CITY' && !u.cityId) ctx.addIssue({ code: 'custom', path: ['cityId'], message: 'Choose a city' });
  });

export const createUserSchema = withUserRules(z.strictObject(userFields));

/** Partial edits through the API: the stored values fill the gaps, so cross-field rules run in UsersService. */
export const updateUserSchema = z.strictObject({ ...userFields, isActive: z.boolean() }).partial();

/** The Add/Edit user form: like create, but an unchanged account number isn't sent (older ones may predate the format). */
export const userFormSchema = withUserRules(z.object({ ...userFields, accountNumber: accountNumber.optional() }));

// --- Stations and trucks ------------------------------------------------------------------------------------------

const stationFields = {
  name: text(150),
  lat,
  lng,
  /** The fire district follows from the city. */
  cityId: z.int({ error: 'Choose a city' }),
  address: optionalText(250),
  contactNumber: optionalText(50),
};

export const createStationSchema = z.strictObject(stationFields);
export const updateStationSchema = z.strictObject({ ...stationFields, isActive: z.boolean() }).partial();

const truckFields = {
  callSign: text(80),
  plateNumber: optionalText(20),
  type: z.enum(TRUCK_TYPES, { error: 'Choose a truck type' }),
  waterCapacityLiters: z.int({ error: 'Whole litres only' }).min(0, 'Cannot be negative').nullable().optional(),
  ownership: z.enum(TRUCK_OWNERSHIPS, { error: 'Choose an owner' }),
};

export const createTruckSchema = z.strictObject(truckFields);
export const updateTruckSchema = z.strictObject({ ...truckFields, status: z.enum(TRUCK_STATUSES) }).partial();

// --- Special deployments ------------------------------------------------------------------------------------------

const deploymentFields = {
  name: text(120),
  locationLabel: text(250),
  lat,
  lng,
  // ISO date-time strings, not z.date(): Swagger turns these schemas into JSON Schema, which has no Date type.
  startsAt: z.iso.datetime({ offset: true, error: 'Choose the start' }),
  /** Planned end, for information; trucks return only when released or the deployment is ended. */
  endsAt: z.iso.datetime({ offset: true, error: 'Not a valid date' }).nullable().optional(),
  notes: optionalText(2000),
};

type DeploymentDates = { startsAt?: string; endsAt?: string | null };
const endsAfterStart = <T extends z.ZodType<DeploymentDates>>(schema: T) =>
  schema.refine((d) => !d.startsAt || !d.endsAt || new Date(d.endsAt) >= new Date(d.startsAt), { path: ['endsAt'], message: 'Ends before it starts' });

/** Create: the details; trucks are added with assignTrucksSchema (also allowed here). */
export const createDeploymentSchema = endsAfterStart(z.strictObject({ ...deploymentFields, truckIds: z.array(z.int()).max(300).default([]) }));
/** Partial edits; DeploymentsService checks the dates against the stored ones. */
export const updateDeploymentSchema = z.strictObject(deploymentFields).partial();
/** Where one deployed truck stands, e.g. "Quiapo Church" (the post form uses it too). */
export const truckPostSchema = z.strictObject({ postLabel: text(250), lat, lng });
export const assignTrucksSchema = z.strictObject({ truckIds: z.array(z.int()).min(1, 'Pick at least one truck').max(300) });
/** The New / Edit deployment form. */
export const deploymentFormSchema = endsAfterStart(z.object(deploymentFields));

// --- Settings and passwords ---------------------------------------------------------------------------------------

export const settingsSchema = z.strictObject({
  stationsPerAlarm: z.int({ error: 'A whole number' }).min(1, 'At least 1').max(20, 'At most 20'),
  maxDistanceKm: z.number({ error: 'A number' }).min(1, 'At least 1 km').max(200, 'At most 200 km'),
  alarmLevels: z.array(text(40)).min(1, 'Add at least one alarm level').max(30, 'At most 30 alarm levels'),
});

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().max(200),
  newPassword: z.string().min(8, 'At least 8 characters').max(200, 'At most 200 characters'),
});
