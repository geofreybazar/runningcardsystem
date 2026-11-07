import type { z } from 'zod';
import type { createUserSchema, updateUserSchema } from '../shared/validation.js';

export { accountNumber, createUserSchema, updateUserSchema } from '../shared/validation.js';
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
