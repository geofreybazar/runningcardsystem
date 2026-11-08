-- Volunteer is no longer an owner type: existing Volunteer trucks become BFP (decided 2026-11-08), then the value is dropped.
UPDATE "Truck" SET "ownership" = 'BFP' WHERE "ownership" = 'VOLUNTEER';

ALTER TYPE "TruckOwnership" RENAME TO "TruckOwnership_old";
CREATE TYPE "TruckOwnership" AS ENUM ('BFP', 'LGU');
ALTER TABLE "Truck" ALTER COLUMN "ownership" DROP DEFAULT;
ALTER TABLE "Truck" ALTER COLUMN "ownership" TYPE "TruckOwnership" USING ("ownership"::text::"TruckOwnership");
ALTER TABLE "Truck" ALTER COLUMN "ownership" SET DEFAULT 'BFP';
DROP TYPE "TruckOwnership_old";

-- Special deployments: where each truck stands (null = at the deployment's location).
ALTER TABLE "DeploymentUnit" ADD COLUMN "postLabel" TEXT,
ADD COLUMN "postLat" DOUBLE PRECISION,
ADD COLUMN "postLng" DOUBLE PRECISION;
