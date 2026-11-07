import { z } from 'zod';

const day = z.iso.date({ error: 'Use a date like 2026-11-08' });

/** Statistics filters: a Manila date range (inclusive, at most 2 years) and optionally a district or city. */
export const statisticsQuerySchema = z
  .strictObject({
    from: day.optional(),
    to: day.optional(),
    districtId: z.coerce.number().int().optional(),
    cityId: z.coerce.number().int().optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'from must be on or before to', path: ['from'] })
  .refine((q) => !q.from || !q.to || Date.parse(q.to) - Date.parse(q.from) <= 731 * 86_400_000, { message: 'At most 2 years at a time', path: ['to'] });

export type StatisticsQuery = z.infer<typeof statisticsQuerySchema>;
