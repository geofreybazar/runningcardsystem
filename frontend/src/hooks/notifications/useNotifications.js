import { createContext, useContext } from "react";

export const NotificationsContext = createContext({
  unread: 0,
  openIncidents: 0,
  last: null,
  version: 0,
  markSeen: () => {},
  viewIncident: () => () => {},
  refreshOpen: () => {},
  linkStatus: "connecting",
});

/** Unread count, open incidents in my area, the latest live notification, the live link status, and the mark-seen actions. */
const useNotifications = () => useContext(NotificationsContext);

export default useNotifications;
