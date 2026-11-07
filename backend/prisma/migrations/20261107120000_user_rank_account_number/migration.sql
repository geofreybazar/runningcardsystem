-- Rank, split names, and username -> accountNumber (renamed so existing sign-in names carry over).
CREATE TYPE "Rank" AS ENUM ('FO1', 'FO2', 'FO3', 'SFO1', 'SFO2', 'SFO3', 'SFO4', 'FINSP', 'FSINSP', 'FCINSP', 'FSUPT', 'FSSUPT', 'FCSUPT');

ALTER TABLE "User" RENAME COLUMN "username" TO "accountNumber";
ALTER INDEX "User_username_key" RENAME TO "User_accountNumber_key";
-- Account numbers are stored uppercase; login uppercases the input, so "superadmin" still signs in.
UPDATE "User" SET "accountNumber" = upper("accountNumber");

ALTER TABLE "User" ADD COLUMN "rank" "Rank",
ADD COLUMN "firstName" TEXT,
ADD COLUMN "middleName" TEXT,
ADD COLUMN "lastName" TEXT;

-- Last word -> lastName, the rest -> firstName. A one-word name lands in firstName; lastName is left empty for an admin to fill.
UPDATE "User" SET
  "firstName" = CASE WHEN btrim("fullName") ~ '\s' THEN regexp_replace(btrim("fullName"), '\s+\S+$', '') ELSE btrim("fullName") END,
  "lastName"  = CASE WHEN btrim("fullName") ~ '\s' THEN substring(btrim("fullName") from '\S+$') ELSE '' END;

ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
DROP COLUMN "fullName";
