-- Names typed in capitals before the API normalized them: store them in proper case, as formatName() in
-- src/shared/validation.ts now does on every create and update ("JUAN DELA CRUZ" -> "Juan Dela Cruz").
-- initcap() differs only on Roman-numeral suffixes ("III" -> "Iii"); re-saving the user in the app fixes those.
UPDATE "User" SET
  "firstName"  = initcap(regexp_replace(btrim("firstName"), '\s+', ' ', 'g')),
  "middleName" = NULLIF(initcap(regexp_replace(btrim("middleName"), '\s+', ' ', 'g')), ''),
  "lastName"   = initcap(regexp_replace(btrim("lastName"), '\s+', ' ', 'g'));
