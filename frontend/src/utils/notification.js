/** Where a notification points: an incident or a special deployment. */
export const notificationLink = (n) => (n.deploymentId ? `/deployments/${n.deploymentId}` : `/incidents/${n.incidentId}`);

/** The place line: "Batasang Pambansa (SONA 2026)" or "Tondo, Manila". */
export const notificationPlace = (n) =>
  n.deploymentId ? `${n.deployment.locationLabel} (${n.deployment.name})` : [n.incident.locationLabel, n.incident.city?.name].filter(Boolean).join(", ");

/** Trucks moved in this step, for the toast and the screen reader. */
export const trucksMoved = (n) => {
  const count = n.units.length;
  if (!count) return undefined;
  const released = n.type === "INCIDENT_CLOSED" || n.type === "DEPLOYMENT_RELEASED";
  const verb = released ? "released" : n.deploymentId ? "deployed" : "sent";
  return `${count} of your truck${count > 1 ? "s" : ""} ${verb}`;
};
