import { z } from 'zod';

/** No format check here: the seeded Super Admin's account number may not follow the personnel format. */
export const loginSchema = z.strictObject({
  accountNumber: z.string().trim().toUpperCase().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().max(200),
  newPassword: z.string().min(8).max(200),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
