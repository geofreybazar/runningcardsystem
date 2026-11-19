import { TRUCK_TYPES } from "@/constants/truck.js";
import { carriesWater } from "@shared/validation";

export const truckTypeOptions = () => Object.entries(TRUCK_TYPES).map(([value, label]) => ({ value, label }));

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
  // Special units carry no water, so a value typed before switching the type is dropped.
  waterCapacityGallons: !carriesWater(f.type) || f.waterCapacityGallons === "" ? null : Number(f.waterCapacityGallons),
});

export const EMPTY_TRUCK = { callSign: "", plateNumber: "", type: "ENGINE", waterCapacityGallons: "", ownership: "BFP" };

/** Form values for an existing station, or a new one (its city preset when only one is editable). */
export const stationToForm = (s, editableCities) =>
  s
    ? { ...s, cityId: s.cityId ?? "", address: s.address ?? "", contactNumber: s.contactNumber ?? "" }
    : { name: "", cityId: editableCities.length === 1 ? editableCities[0].id : "", address: "", contactNumber: "", lat: null, lng: null };

export const truckToForm = (t) =>
  t ? { ...EMPTY_TRUCK, ...t, plateNumber: t.plateNumber ?? "", waterCapacityGallons: t.waterCapacityGallons ?? "" } : EMPTY_TRUCK;
