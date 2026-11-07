/** "SFO2 Juan D. Dela Cruz": rank (if any), first name, middle initial, last name. The one display format for people. */
export const displayName = (p) =>
  p ? [p.rank, p.firstName, p.middleName && `${p.middleName.trim()[0].toUpperCase()}.`, p.lastName].filter(Boolean).join(" ") : "";
