-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DISPATCHED', 'ALARM_RAISED', 'INCIDENT_CLOSED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationsSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "incidentId" TEXT NOT NULL,
    "cityIds" INTEGER[],
    "type" "NotificationType" NOT NULL,
    "alarmLevel" TEXT NOT NULL,
    "units" JSONB NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_cityIds_idx" ON "Notification" USING GIN ("cityIds");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

