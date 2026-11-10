export const NOTIFICATION_TITLES = {
  DISPATCHED: "Dispatched",
  ALARM_RAISED: "Alarm raised",
  INCIDENT_CLOSED: "Incident closed",
  UNIT_REQUESTED: "Special unit sent",
  DEPLOYMENT_ASSIGNED: "Trucks deployed",
  DEPLOYMENT_RELEASED: "Trucks released",
};

/** Priority by what it asks of the reader: trucks going to a fire need attention; releases and planned events are routine. */
export const NOTIFICATION_PRIORITY = {
  DISPATCHED: "high",
  ALARM_RAISED: "high",
  UNIT_REQUESTED: "high",
  INCIDENT_CLOSED: "routine",
  DEPLOYMENT_ASSIGNED: "info",
  DEPLOYMENT_RELEASED: "routine",
};
