import { api } from "./client.js";

const getDeployments = (status) => api(`/deployments?status=${status}`);
const getDeployment = (id) => api(`/deployments/${id}`);
/** body: { name, locationLabel, lat, lng, startsAt, endsAt?, notes?, truckIds? } */
const createDeployment = (body) => api("/deployments", { method: "POST", body });
const editDeployment = ({ id, ...body }) => api(`/deployments/${id}`, { method: "PATCH", body });
const assignTrucks = ({ id, truckIds }) => api(`/deployments/${id}/trucks`, { method: "POST", body: { truckIds } });
/** Where one deployed truck stands: { id, truckId, postLabel, lat, lng }. */
const setTruckPost = ({ id, truckId, ...body }) => api(`/deployments/${id}/trucks/${truckId}/post`, { method: "PATCH", body });
const releaseTruck = ({ id, truckId }) => api(`/deployments/${id}/trucks/${truckId}/release`, { method: "POST" });
const endDeployment = (id) => api(`/deployments/${id}/end`, { method: "POST" });
/** Soft delete; trucks still there are released first. */
const deleteDeployment = (id) => api(`/deployments/${id}`, { method: "DELETE" });

export default { getDeployments, getDeployment, createDeployment, editDeployment, assignTrucks, setTruckPost, releaseTruck, endDeployment, deleteDeployment };
