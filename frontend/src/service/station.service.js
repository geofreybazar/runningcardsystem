import { api } from "./client.js";

/** "ALL": every active station in the region. */
const getStations = (districtId) => api(districtId === "ALL" ? "/stations" : `/stations?districtId=${districtId}`);
const addStation = (body) => api("/stations", { method: "POST", body });
const editStation = ({ id, ...body }) => api(`/stations/${id}`, { method: "PATCH", body });
const deactivateStation = (id) => api(`/stations/${id}`, { method: "PATCH", body: { isActive: false } });

const addTruck = ({ stationId, ...body }) => api(`/stations/${stationId}/trucks`, { method: "POST", body });
const editTruck = ({ id, ...body }) => api(`/trucks/${id}`, { method: "PATCH", body });
const changeTruckStatus = ({ id, status }) => api(`/trucks/${id}`, { method: "PATCH", body: { status } });
const removeTruck = (id) => api(`/trucks/${id}`, { method: "DELETE" });

export default { getStations, addStation, editStation, deactivateStation, addTruck, editTruck, changeTruckStatus, removeTruck };
