import { api } from "./client.js";

export const AUDIT_PAGE = 100;

const getAuditLogs = ({ entity, skip }) => api(`/audit-logs?take=${AUDIT_PAGE}&skip=${skip}${entity !== "ALL" ? `&entity=${entity}` : ""}`);

export default { getAuditLogs };
