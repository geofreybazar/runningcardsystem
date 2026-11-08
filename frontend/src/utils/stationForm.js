import { TRUCK_TYPES } from "@/constants/truck.js";
import { TRUCK_TYPES as ALLOWED_TRUCK_TYPES } from "@shared/validation";

// Ambulance and Rescue are no longer offered; an existing truck of that type keeps showing it until edited.
export const truckTypeOptions = (current) =>
  Object.keys(TRUCK_TYPES)
    .filter((t) => ALLOWED_TRUCK_TYPES.includes(t) || t === current)
    .map((t) => ({ value: t, label: TRUCK_TYPES[t] }));

const nullIfBlank = (v) => (v === "" || v == null ? null : v);

export const stationBody = (f) => ({
  name: f.name.trim(),
  lat: f.lat ?? undefined,
  lng: f.lng ?? undefined,
  cityId: nullIfBlank(f.cityId) ?? undefined,
  address: nullIfBlank(f.address?.trim()),
  contactNumber: nullIfBlank(f.contactNumber?.trim()),
});

export const truckBody = (f) => ({
  callSign: f.callSign.trim(),
  plateNumber: nullIfBlank(f.plateNumber?.trim()),
  type: f.type,
  ownership: f.ownership,
  waterCapacityLiters: f.waterCapacityLiters === "" ? null : Number(f.waterCapacityLiters),
});

export const EMPTY_TRUCK = { callSign: "", plateNumber: "", type: "ENGINE", waterCapacityLiters: "", ownership: "BFP" };

/** Form values for an existing station, or a new one (its city preset when only one is editable). */
export const stationToForm = (s, editableCities) =>
  s
    ? { ...s, cityId: s.cityId ?? "", address: s.address ?? "", contactNumber: s.contactNumber ?? "" }
    : { name: "", cityId: editableCities.length === 1 ? editableCities[0].id : "", address: "", contactNumber: "", lat: null, lng: null };

export const truckToForm = (t) =>
  t ? { ...EMPTY_TRUCK, ...t, plateNumber: t.plateNumber ?? "", waterCapacityLiters: t.waterCapacityLiters ?? "" } : EMPTY_TRUCK;
