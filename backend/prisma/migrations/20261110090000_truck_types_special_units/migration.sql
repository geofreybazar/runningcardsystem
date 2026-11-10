-- BFP truck types (decided 2026-11-10): Aerial Ladder → Ladder, Rescue → Rescue Truck, Other → Engine;
-- Mini Pumper and CSSR Truck are new. Only Mini Pumper and Engine go on the running card.
ALTER TYPE "TruckType" RENAME TO "TruckType_old";
CREATE TYPE "TruckType" AS ENUM ('MINI_PUMPER', 'ENGINE', 'TANKER', 'LADDER', 'RESCUE_TRUCK', 'CSSR_TRUCK', 'AMBULANCE');
ALTER TABLE "Truck" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Truck" ALTER COLUMN "type" TYPE "TruckType" USING (
  CASE "type"::text
    WHEN 'AERIAL_LADDER' THEN 'LADDER'
    WHEN 'RESCUE' THEN 'RESCUE_TRUCK'
    WHEN 'OTHER' THEN 'ENGINE'
    ELSE "type"::text
  END
)::"TruckType";
ALTER TABLE "Truck" ALTER COLUMN "type" SET DEFAULT 'ENGINE';
DROP TYPE "TruckType_old";

-- Special units requested on an incident (outside the running card).
ALTER TYPE "NotificationType" ADD VALUE 'UNIT_REQUESTED' AFTER 'INCIDENT_CLOSED';
ALTER TABLE "IncidentUnit" ADD COLUMN "special" BOOLEAN NOT NULL DEFAULT false;
