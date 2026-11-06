-- CreateEnum
CREATE TYPE "OfficeLevel" AS ENUM ('REGIONAL', 'DISTRICT', 'CITY');

-- AlterTable
ALTER TABLE "City" ADD COLUMN     "boundary" JSONB;

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "cityId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cityId" INTEGER,
ADD COLUMN     "officeLevel" "OfficeLevel" NOT NULL DEFAULT 'REGIONAL';

-- CreateIndex
CREATE INDEX "Incident_cityId_idx" ON "Incident"("cityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data: existing Operations accounts were district-scoped. Radio Operators stay REGIONAL (view only) until Admin assigns their office.
UPDATE "User" SET "officeLevel" = 'DISTRICT' WHERE "role" = 'OPERATIONS' AND "districtId" IS NOT NULL;
