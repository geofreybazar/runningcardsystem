import { api } from "./client.js";

const getSettings = () => api("/settings");
const editSettings = (body) => api("/settings", { method: "PUT", body });

export default { getSettings, editSettings };
