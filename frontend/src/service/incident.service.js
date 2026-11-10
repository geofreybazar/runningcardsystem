import { api } from "./client.js";

const getIncidents = (status) => api(`/incidents?status=${status}`);
const getIncident = (id) => api(`/incidents/${id}`);
/** The next alarm level's running card, or null at the highest level. */
const getNextAlarm = (id) => api(`/incidents/${id}/next-alarm`);
/** body: { lat, lng, locationLabel, notes?, barangayId?, truckPicks } */
const createIncident = (body) => api("/incidents", { method: "POST", body });
const raiseAlarm = ({ id, truckPicks }) => api(`/incidents/${id}/raise`, { method: "POST", body: { truckPicks } });
const closeIncident = (id) => api(`/incidents/${id}/close`, { method: "POST" });
/** Nearest stations with an available special unit of `type` (AMBULANCE, LADDER, …). */
const getSpecialUnits = (id, type) => api(`/incidents/${id}/special-units?type=${type}`);
const requestSpecialUnit = ({ id, truckId }) => api(`/incidents/${id}/special-units`, { method: "POST", body: { truckId } });

export default { getIncidents, getIncident, getNextAlarm, createIncident, raiseAlarm, closeIncident, getSpecialUnits, requestSpecialUnit };
