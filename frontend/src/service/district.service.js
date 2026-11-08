import { api } from "./client.js";

/** Districts with their cities. */
const getDistricts = () => api("/districts");
const getBarangays = (cityId) => api(`/cities/${cityId}/barangays`);
/** Saves a barangay's geocoded pin; returns the updated barangay. */
const saveBarangayPin = ({ id, lat, lng }) => api(`/barangays/${id}/location`, { method: "PUT", body: { lat, lng } });

export default { getDistricts, getBarangays, saveBarangayPin };
