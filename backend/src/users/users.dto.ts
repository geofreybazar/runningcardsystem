import { z } from 'zod';
import { OfficeLevel, Rank, Role } from '../generated/prisma/enums.js';

/** BFP account number, e.g. B13084. Uppercased first, so b13084 is accepted and stored as B13084. */
export const accountNumber = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{1,3}\d{4,8}$/, 'Account number must be 1-3 letters followed by 4-8 digits, e.g. B13084');

const name = z.string().trim().min(1, 'is required').max(60);
const middleName = z.string().trim().max(60).transform((s) => s || null).nullable().optional();
/** Required for every role except SUPER_ADMIN; checked in UsersService because it depends on the final role. */
const rank = z.enum(Rank).nullable().optional();
/** Defaults to REGIONAL. DISTRICT needs districtId; CITY needs cityId (the district follows from the city). */
const office = {
  officeLevel: z.enum(OfficeLevel).optional(),
  districtId: z.int().nullable().optional(),
  cityId: z.int().nullable().optional(),
};

export const createUserSchema = z.strictObject({
  rank,
  firstName: name,
  middleName,
  lastName: name,
  accountNumber,
  role: z.enum(Role),
  ...office,
});

export const updateUserSchema = z.strictObject({
  rank,
  firstName: name.optional(),
  middleName,
  lastName: name.optional(),
  accountNumber: accountNumber.optional(),
  role: z.enum(Role).optional(),
  ...office,
  isActive: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
