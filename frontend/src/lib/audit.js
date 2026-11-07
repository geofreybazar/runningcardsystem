/** Filters on the Audit log page: entity name → label. */
export const AUDIT_ENTITIES = { Session: "Sign-ins", Incident: "Incidents", User: "Accounts", Station: "Stations", Truck: "Trucks", Barangay: "Barangay pins", Settings: "Settings" };

export const ACTION_LABELS = {
  SIGN_IN: "Signed in",
  SIGN_IN_FAILED: "Sign-in failed",
  SIGN_OUT: "Signed out",
  TOKEN_REUSED: "Session reuse detected",
  CHANGE_PASSWORD: "Changed own password",
  DISPATCH: "Dispatched",
  RAISE_ALARM: "Raised alarm",
  CLOSE: "Closed incident",
  SET_PIN: "Pinned barangay",
};

/** Actions an administrator should notice. */
export const WARNING_ACTIONS = new Set(["SIGN_IN_FAILED", "TOKEN_REUSED"]);

const from = (ip) => (ip ? ` from ${ip}` : "");
const list = (trucks) => (trucks?.length ? trucks.join(", ") : "no trucks");
const point = (p) => (p ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` : "");

/** One readable line for an entry; anything not described here falls back to its raw changes. */
export function auditDetails({ action, entity, changes: c, ip }) {
  if (action === "SIGN_IN") return `Signed in${from(ip)}`;
  if (action === "SIGN_IN_FAILED") return `${c?.reason ?? "failed"}, account number ${c?.accountNumber ?? "?"}${from(ip)}`;
  if (action === "TOKEN_REUSED") return "A refresh token was used twice (possible stolen session); all its sessions were signed out";
  if (action === "DISPATCH") return `${c.alarmLevel} for ${c.locationLabel} (${c.city}): ${list(c.trucks)}`;
  if (action === "RAISE_ALARM") return `${c.alarmLevel}: ${list(c.trucks)}`;
  if (action === "CLOSE") return `Closed at ${c.alarmLevel}; released ${list(c.released)}`;
  if (entity === "Barangay" && c?.to) return `${c.name ?? "Barangay"}: ${c.from ? `${point(c.from)} → ` : ""}${point(c.to)}`;
  return c ? JSON.stringify(c) : "";
}
