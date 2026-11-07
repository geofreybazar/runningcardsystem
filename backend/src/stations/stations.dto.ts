import { z } from 'zod';
import type { createStationSchema, createTruckSchema, updateStationSchema, updateTruckSchema } from '../shared/validation.js';

export { createStationSchema, createTruckSchema, lat, lng, updateStationSchema, updateTruckSchema } from '../shared/validation.js';

export const stationQuerySchema = z.strictObject({
  districtId: z.coerce.number().int().optional(),
  cityId: z.coerce.number().int().optional(),
});

export type StationQuery = z.infer<typeof stationQuerySchema>;
export type CreateStationDto = z.infer<typeof createStationSchema>;
export type UpdateStationDto = z.infer<typeof updateStationSchema>;
export type CreateTruckDto = z.infer<typeof createTruckSchema>;
export type UpdateTruckDto = z.infer<typeof updateTruckSchema>;
