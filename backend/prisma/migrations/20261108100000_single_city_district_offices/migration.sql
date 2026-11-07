-- Manila (FD1) and Quezon City (FD5) have only district offices: move any city-level accounts there.
-- Their area and dispatch rights stay the same (a single-city district acts as that city).
UPDATE "User" u SET "officeLevel" = 'DISTRICT', "cityId" = NULL
WHERE u."officeLevel" = 'CITY'
  AND (SELECT count(*) FROM "City" c WHERE c."districtId" = u."districtId") = 1;
