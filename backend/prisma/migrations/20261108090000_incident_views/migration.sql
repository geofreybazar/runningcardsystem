-- CreateTable
CREATE TABLE "IncidentView" (
    "userId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentView_pkey" PRIMARY KEY ("userId","incidentId")
);

-- AddForeignKey
ALTER TABLE "IncidentView" ADD CONSTRAINT "IncidentView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentView" ADD CONSTRAINT "IncidentView_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

