import { ROLE_LABELS } from "@/constants/roles.js";
import { OFFICE_LEVELS } from "@/constants/office.js";

// Mirrors the backend rule: Admin (regional IT) manages every account except Super Admin.
export const manageableRoles = (role) => Object.keys(ROLE_LABELS).filter((r) => role === "SUPER_ADMIN" || r !== "SUPER_ADMIN");

export const EMPTY_USER = {
  rank: "",
  firstName: "",
  middleName: "",
  lastName: "",
  accountNumber: "",
  role: "RADIO_OPERATOR",
  officeLevel: "CITY",
  districtId: "",
  cityId: "",
};

export const hasCityOffices = (d) => d.cities.length > 1;

/** Role → office level → district → city, keeping only combinations the role allows. */
export function normalizeOffice(form, districts) {
  const levels = OFFICE_LEVELS[form.role];
  const officeLevel = levels.includes(form.officeLevel) ? form.officeLevel : levels[0];
  let district = districts.find((d) => d.id === form.districtId);
  // Manila (FD1) and Quezon City (FD5) are their own districts: they have no city office.
  if (officeLevel === "CITY" && district && !hasCityOffices(district)) district = undefined;
  let cityId = officeLevel === "CITY" ? form.cityId : "";
  if (cityId && !district?.cities.some((c) => c.id === cityId)) cityId = "";
  return { ...form, officeLevel, districtId: officeLevel === "REGIONAL" ? "" : (district?.id ?? ""), cityId };
}

export const dispatchNote = (form, districts) => {
  if (form.role !== "RADIO_OPERATOR") return null;
  const district = districts.find((d) => d.id === form.districtId);
  if (form.officeLevel === "CITY" || (form.officeLevel === "DISTRICT" && district?.cities.length === 1)) return "Can dispatch for fires in this city.";
  return "View only: sees incidents in this area but cannot dispatch.";
};

/** The request body for the form; the account number is sent on create, and on edit only when changed (older ones may predate the format). */
export function userBody(form) {
  const accountNumber = form.accountNumber.trim().toUpperCase();
  return {
    rank: form.role === "SUPER_ADMIN" ? null : form.rank || null,
    firstName: form.firstName.trim(),
    middleName: form.middleName?.trim() || null,
    lastName: form.lastName.trim(),
    role: form.role,
    officeLevel: form.officeLevel,
    districtId: form.officeLevel === "DISTRICT" ? form.districtId || null : null,
    cityId: form.officeLevel === "CITY" ? form.cityId || null : null,
    ...((!form.id || accountNumber !== form.originalAccountNumber) && { accountNumber }),
  };
}

/** The edit form's starting values for an existing user. */
export const userToForm = (u) => ({
  ...u,
  rank: u.rank ?? "",
  middleName: u.middleName ?? "",
  originalAccountNumber: u.accountNumber,
  districtId: u.districtId ?? "",
  cityId: u.cityId ?? "",
});
