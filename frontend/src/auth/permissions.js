// Mirrors backend/src/auth/access.policy.ts so the UI only shows actions the server will allow.

export const OFFICE_LEVELS = {
  SUPER_ADMIN: ["REGIONAL"],
  ADMIN: ["REGIONAL"],
  OPERATIONS: ["DISTRICT", "CITY"],
  RADIO_OPERATOR: ["REGIONAL", "DISTRICT", "CITY"],
};

export const OFFICE_LABELS = { REGIONAL: "Regional office", DISTRICT: "District office", CITY: "City office" };

/** May dispatch / raise / close for a fire in this city. */
export const canDispatchIn = (user, cityId) =>
  user.role === "SUPER_ADMIN" || (user.role === "RADIO_OPERATOR" && cityId != null && user.dispatchCityId === cityId);

export const canDispatchAnywhere = (user) => user.role === "SUPER_ADMIN" || user.dispatchCityId != null;

/** May edit stations, trucks and barangay pins in this city. */
export const canEditCity = (user, cityId) =>
  user.role === "SUPER_ADMIN" || (user.role === "OPERATIONS" && cityId != null && !!user.areaCityIds?.includes(cityId));

/** "Caloocan · City office", "Fire District 2 · District office", "Regional office". */
export function officeName(u) {
  if (u.officeLevel === "CITY") return `${u.city?.name ?? "City"} City office`;
  if (u.officeLevel === "DISTRICT") return `${u.district?.name ?? "District"}${u.district?.alias ? ` (${u.district.alias})` : ""}`;
  return "Regional office";
}
