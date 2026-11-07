import { z } from 'zod';
import { IncidentStatus } from '../generated/prisma/enums.js';
import { lat, lng } from '../stations/stations.dto.js';

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

export type CreateIncidentDto = z.infer<typeof createIncidentSchema>;
export type RaiseAlarmDto = z.infer<typeof raiseAlarmSchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
