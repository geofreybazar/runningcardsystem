import { api } from "./client.js";

/** { city, alarms }: built on the server from live truck status. */
const getRunningCard = ({ lat, lng }) => api(`/running-card?lat=${lat}&lng=${lng}`);

export default { getRunningCard };
