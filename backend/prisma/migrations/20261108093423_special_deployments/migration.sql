-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('ACTIVE', 'ENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DEPLOYMENT_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'DEPLOYMENT_RELEASED';

-- AlterEnum
ALTER TYPE "TruckStatus" ADD VALUE 'DEPLOYED';

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_incidentId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "deploymentId" TEXT,
ALTER COLUMN "incidentId" DROP NOT NULL,
ALTER COLUMN "alarmLevel" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SpecialDeployment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "endedAt" TIMESTAMP(3),
    "endedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentUnit" (
    "id" SERIAL NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "stationId" INTEGER NOT NULL,
    "truckId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "releasedById" TEXT,

    CONSTRAINT "DeploymentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialDeployment_status_idx" ON "SpecialDeployment"("status");

-- CreateIndex
CREATE INDEX "DeploymentUnit_deploymentId_idx" ON "DeploymentUnit"("deploymentId");

-- CreateIndex
CREATE INDEX "DeploymentUnit_truckId_releasedAt_idx" ON "DeploymentUnit"("truckId", "releasedAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "SpecialDeployment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialDeployment" ADD CONSTRAINT "SpecialDeployment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialDeployment" ADD CONSTRAINT "SpecialDeployment_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentUnit" ADD CONSTRAINT "DeploymentUnit_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "SpecialDeployment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentUnit" ADD CONSTRAINT "DeploymentUnit_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentUnit" ADD CONSTRAINT "DeploymentUnit_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentUnit" ADD CONSTRAINT "DeploymentUnit_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentUnit" ADD CONSTRAINT "DeploymentUnit_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
