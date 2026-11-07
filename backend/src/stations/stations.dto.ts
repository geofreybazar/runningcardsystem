import { z } from 'zod';
import { TruckOwnership, TruckStatus, TruckType } from '../generated/prisma/enums.js';

export const lat = z.number().min(-90).max(90);
export const lng = z.number().min(-180).max(180);

export const stationQuerySchema = z.strictObject({
  districtId: z.coerce.number().int().optional(),
  cityId: z.coerce.number().int().optional(),
});

const stationFields = {
  name: z.string().min(1).max(150),
  lat,
  lng,
  /** The fire district follows from the city. */
  cityId: z.int(),
  address: z.string().max(250).nullable().optional(),
  contactNumber: z.string().max(50).nullable().optional(),
};

export const createStationSchema = z.strictObject(stationFields);
export const updateStationSchema = z.strictObject({ ...stationFields, isActive: z.boolean() }).partial();

const truckFields = {
  callSign: z.string().min(1).max(80),
  plateNumber: z.string().max(20).nullable().optional(),
  type: z.enum(TruckType),
  waterCapacityLiters: z.int().min(0).nullable().optional(),
  ownership: z.enum(TruckOwnership),
};

export const createTruckSchema = z.strictObject(truckFields);
export const updateTruckSchema = z.strictObject({ ...truckFields, status: z.enum(TruckStatus) }).partial();

export type StationQuery = z.infer<typeof stationQuerySchema>;
export type CreateStationDto = z.infer<typeof createStationSchema>;
export type UpdateStationDto = z.infer<typeof updateStationSchema>;
export type CreateTruckDto = z.infer<typeof createTruckSchema>;
export type UpdateTruckDto = z.infer<typeof updateTruckSchema>;
