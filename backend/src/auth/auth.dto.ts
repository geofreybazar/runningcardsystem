import { z } from 'zod';
import type { changePasswordSchema } from '../shared/validation.js';

export { changePasswordSchema } from '../shared/validation.js';

/** No format check here: the seeded Super Admin's account number may not follow the personnel format. */
export const loginSchema = z.strictObject({
  accountNumber: z.string().trim().toUpperCase().min(1).max(100),
  password: z.string().min(1).max(200),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
