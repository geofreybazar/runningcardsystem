-- Water capacity is kept in US gallons. Operators already entered gallon values in the old "liters" field,
-- so this only renames the column; the stored numbers are not converted.
ALTER TABLE "Truck" RENAME COLUMN "waterCapacityLiters" TO "waterCapacityGallons";

-- Only fire apparatus (Mini Pumper, Engine, Tanker) carry water.
UPDATE "Truck" SET "waterCapacityGallons" = NULL WHERE "type" IN ('LADDER', 'RESCUE_TRUCK', 'CSSR_TRUCK', 'AMBULANCE');
