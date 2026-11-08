import { displayName } from "./person.js";

export const NO_FILTERS = { search: "", office: "ALL", cityId: "ALL" };

/**
 * Users matching the Users page filters. `office`: "ALL", "REGIONAL" or a district id (its district and city offices);
 * `cityId`: "ALL" or one city's office. `search` matches the name or the account number.
 */
export function filterUsers(users, { search, office, cityId }) {
  const q = search.trim().toLowerCase();
  return users.filter(
    (u) =>
      (office === "ALL" || (office === "REGIONAL" ? u.officeLevel === "REGIONAL" : u.districtId === office)) &&
      (cityId === "ALL" || u.cityId === cityId) &&
      (!q || displayName(u).toLowerCase().includes(q) || u.accountNumber.toLowerCase().includes(q)),
  );
}
