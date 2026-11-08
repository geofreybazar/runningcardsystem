// Mirrors backend/src/auth/access.policy.ts so the UI only shows actions the server will allow.

/** May dispatch / raise / close for a fire in this city. */
export const canDispatchIn = (user, cityId) =>
  user.role === "SUPER_ADMIN" || (user.role === "RADIO_OPERATOR" && cityId != null && user.dispatchCityId === cityId);

export const canDispatchAnywhere = (user) => user.role === "SUPER_ADMIN" || user.dispatchCityId != null;

/** May edit stations, trucks and barangay pins in this city. */
export const canEditCity = (user, cityId) =>
  user.role === "SUPER_ADMIN" || (user.role === "OPERATIONS" && cityId != null && user.officeCityId === cityId);

/** Special deployments (ASEAN, SONA, …): the Regional Operations office, and Super Admin. */
export const canManageDeployments = (user) => user.role === "SUPER_ADMIN" || (user.role === "OPERATIONS" && user.officeLevel === "REGIONAL");

const ROMAN = ["", "I", "II", "III", "IV", "V"];
// FD1 and FD5 are named after their single city.
const DISTRICT_NAMES = { 1: "Manila Fire District", 5: "Quezon City Fire District" };

/** "Fire District II (CAMANAVA)", "Manila Fire District": the BFP name of a fire district. */
export const districtName = (d) =>
  DISTRICT_NAMES[d.code] ?? `Fire District ${ROMAN[d.code] ?? d.code}${d.alias ? ` (${d.alias})` : ""}`;

/** BFP office names: "Caloocan City Fire Station", "Fire District II", "Manila Fire District", "Regional Headquarters". */
export function officeName(u) {
  const code = u.district?.code;
  if (u.officeLevel === "CITY") {
    if (DISTRICT_NAMES[code]) return DISTRICT_NAMES[code];
    const name = u.city?.name ?? "City";
    // Pateros is a municipality; names already ending in "City" don't repeat it.
    if (name === "Pateros") return "Pateros Municipal Fire Station";
    return `${name.replace(/ City$/, "")} City Fire Station`;
  }
  if (u.officeLevel === "DISTRICT") return DISTRICT_NAMES[code] ?? `Fire District ${ROMAN[code] ?? code}`;
  return "Regional Headquarters";
}
