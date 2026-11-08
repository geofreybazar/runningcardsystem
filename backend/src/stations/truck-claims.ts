import type { PrismaService } from '../prisma/prisma.service.js';
import type { TruckStatus } from '../generated/prisma/enums.js';

type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

/**
 * Takes one Available truck for a fire (RESPONDING) or a special deployment (DEPLOYED). The update is conditional on
 * AVAILABLE, so two requests can't both get the same truck: false means someone else took it first.
 */
export async function claimTruck(tx: Tx, truckId: number, to: Extract<TruckStatus, 'RESPONDING' | 'DEPLOYED'>) {
  const { count } = await tx.truck.updateMany({ where: { id: truckId, status: 'AVAILABLE', isActive: true }, data: { status: to } });
  return count === 1;
}

/**
 * Gives trucks back (→ AVAILABLE), but only those still in the given status: a truck Operations marked out of service
 * meanwhile stays out of service.
 */
export function releaseTrucks(tx: Tx, truckIds: number[], from: Extract<TruckStatus, 'RESPONDING' | 'DEPLOYED'>) {
  return tx.truck.updateMany({ where: { id: { in: truckIds }, status: from }, data: { status: 'AVAILABLE' } });
}
