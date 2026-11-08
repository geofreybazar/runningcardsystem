import { api, stream } from "./client.js";

export const NOTIFICATION_PAGE = 20;

/** Newest first; `before` is a notification id to page back from. */
const getNotifications = (before) => api(`/notifications?take=${NOTIFICATION_PAGE}${before ? `&before=${before}` : ""}`);
const getUnreadCount = () => api("/notifications/unread-count");
/** Marks everything read, or only one incident's notifications. */
const markSeen = (incidentId) => api("/notifications/seen", { method: "POST", ...(incidentId && { body: { incidentId } }) });
/** Live notifications (SSE); resolves when the server ends the stream. */
const listen = (onEvent, signal) => stream("/notifications/stream", onEvent, signal);

export default { getNotifications, getUnreadCount, markSeen, listen };
