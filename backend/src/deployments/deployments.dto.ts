import { z } from 'zod';
import { DEPLOYMENT_STATUSES } from '../shared/validation.js';

export { assignTrucksSchema, createDeploymentSchema, truckPostSchema, updateDeploymentSchema } from '../shared/validation.js';
import type { assignTrucksSchema, createDeploymentSchema, truckPostSchema, updateDeploymentSchema } from '../shared/validation.js';

export const deploymentQuerySchema = z.strictObject({ status: z.enum(DEPLOYMENT_STATUSES).optional() });

export type CreateDeploymentDto = z.infer<typeof createDeploymentSchema>;
export type UpdateDeploymentDto = z.infer<typeof updateDeploymentSchema>;
export type AssignTrucksDto = z.infer<typeof assignTrucksSchema>;
export type TruckPostDto = z.infer<typeof truckPostSchema>;
export type DeploymentQuery = z.infer<typeof deploymentQuerySchema>;
