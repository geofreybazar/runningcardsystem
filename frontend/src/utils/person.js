/** "SFO2 Juan D Dela Cruz": rank (if any), first name, middle initial (no period, as uniformed personnel write it), last name. The one display format for people. */
export const displayName = (p) =>
  p ? [p.rank, p.firstName, p.middleName?.trim() && p.middleName.trim()[0].toUpperCase(), p.lastName].filter(Boolean).join(" ") : "";

/** "JD" from first and last name, for avatars. */
export const initials = (p) => [p.firstName, p.lastName].map((w) => w?.trim()[0] ?? "").join("").toUpperCase();
