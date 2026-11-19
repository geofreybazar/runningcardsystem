-- Water capacity is kept in US gallons. Rename (not drop/add) so stored values survive, then convert litres to gallons.
ALTER TABLE "Truck" RENAME COLUMN "waterCapacityLiters" TO "waterCapacityGallons";
UPDATE "Truck" SET "waterCapacityGallons" = ROUND("waterCapacityGallons" / 3.785411784) WHERE "waterCapacityGallons" IS NOT NULL;

-- Only fire apparatus (Mini Pumper, Engine, Tanker) carry water.
UPDATE "Truck" SET "waterCapacityGallons" = NULL WHERE "type" IN ('LADDER', 'RESCUE_TRUCK', 'CSSR_TRUCK', 'AMBULANCE');
