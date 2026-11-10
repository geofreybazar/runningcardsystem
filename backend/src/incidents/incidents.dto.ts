import { z } from 'zod';
import { IncidentStatus } from '../generated/prisma/enums.js';
import { lat, lng } from '../stations/stations.dto.js';
import { SPECIAL_TRUCK_TYPES } from '../shared/validation.js';

/** stationId → truckId the operator chose; stations not listed send their first available truck. */
const truckPicks = z.record(z.string(), z.int()).optional();
export type TruckPicks = Record<string, number>;

export const createIncidentSchema = z.strictObject({
  lat,
  lng,
  locationLabel: z.string().min(1).max(250),
  barangayId: z.int().optional(),
  notes: z.string().max(2000).optional(),
  truckPicks,
});

// Raise may be posted without a body.
export const raiseAlarmSchema = z.strictObject({ truckPicks }).default({});

export const incidentQuerySchema = z.strictObject({
  status: z.enum(IncidentStatus).optional(),
  take: z.coerce.number().int().min(1).optional(),
});

/** Which special unit (ambulance, ladder, …) to look for near the incident. */
export const specialUnitsQuerySchema = z.strictObject({ type: z.enum(SPECIAL_TRUCK_TYPES) });
/** The special unit to send: one of the trucks the special-units list offered. */
export const requestSpecialUnitSchema = z.strictObject({ truckId: z.int() });

export type CreateIncidentDto = z.infer<typeof createIncidentSchema>;
export type RaiseAlarmDto = z.infer<typeof raiseAlarmSchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
export type SpecialUnitsQuery = z.infer<typeof specialUnitsQuerySchema>;
export type RequestSpecialUnitDto = z.infer<typeof requestSpecialUnitSchema>;
