import { createContext, useContext } from "react";

export const NotificationsContext = createContext({
  unread: 0,
  openIncidents: 0,
  last: null,
  version: 0,
  markSeen: () => {},
  viewIncident: () => () => {},
  refreshOpen: () => {},
});

/** Unread count, open incidents in my area, the latest live notification, and the mark-seen actions. */
const useNotifications = () => useContext(NotificationsContext);

export default useNotifications;
