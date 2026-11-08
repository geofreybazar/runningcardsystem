import { api, download } from "./client.js";

/** query: URLSearchParams string (from, to, districtId?, cityId?). */
const getStatistics = (query) => api(`/statistics?${query}`);
const downloadIncidentsCsv = (query) => download(`/statistics/incidents.csv?${query}`);

export default { getStatistics, downloadIncidentsCsv };
