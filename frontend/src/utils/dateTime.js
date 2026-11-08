/** "Nov 8, 2026, 3:24 PM" in the viewer's locale. */
export const formatDateTime = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

/** "03:24 PM": time of day only. */
export const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
