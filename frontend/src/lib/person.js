/** BFP ranks, lowest to highest; mirrors the backend Rank enum. */
export const RANKS = ["FO1", "FO2", "FO3", "SFO1", "SFO2", "SFO3", "SFO4", "FINSP", "FSINSP", "FCINSP", "FSUPT", "FSSUPT", "FCSUPT"];

/** "SFO2 Juan D. Dela Cruz": rank (if any), first name, middle initial, last name. The one display format for people. */
export const displayName = (p) =>
  p ? [p.rank, p.firstName, p.middleName && `${p.middleName.trim()[0].toUpperCase()}.`, p.lastName].filter(Boolean).join(" ") : "";
