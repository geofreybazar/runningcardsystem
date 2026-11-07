-- "Seen" marks by notification id instead of time: ids only grow, so clock steps can't make a new notification look read.
-- Existing marks are converted to the highest id created up to that time, so nobody's read state changes.
ALTER TABLE "User" ADD COLUMN "notificationsSeenId" INTEGER NOT NULL DEFAULT 0;
UPDATE "User" u SET "notificationsSeenId" = COALESCE((SELECT max(n.id) FROM "Notification" n WHERE n."createdAt" <= u."notificationsSeenAt"), 0)
WHERE u."notificationsSeenAt" IS NOT NULL;
ALTER TABLE "User" DROP COLUMN "notificationsSeenAt";

ALTER TABLE "IncidentView" ADD COLUMN "seenId" INTEGER NOT NULL DEFAULT 0;
UPDATE "IncidentView" v SET "seenId" = COALESCE((SELECT max(n.id) FROM "Notification" n WHERE n."incidentId" = v."incidentId" AND n."createdAt" <= v."seenAt"), 0);
ALTER TABLE "IncidentView" ALTER COLUMN "seenId" DROP DEFAULT, DROP COLUMN "seenAt";
