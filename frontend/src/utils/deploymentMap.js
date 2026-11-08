/** Where a deployed truck stands: its own post, or the event location when none is set. */
export const unitPosition = (unit, deployment) =>
  unit.postLat != null ? { lat: unit.postLat, lng: unit.postLng } : { lat: deployment.lat, lng: deployment.lng };

/** One fire-truck marker per truck still on the deployment, in its district colour; the tooltip says where and whose. */
export const deployedTruckMarkers = (deployment) =>
  deployment.units
    .filter((u) => !u.releasedAt)
    .map((u) => ({
      id: u.id,
      position: unitPosition(u, deployment),
      color: u.station.district.color,
      title: u.truck.callSign,
      details: [`Post: ${u.postLabel ?? `${deployment.locationLabel} (event location)`}`, [u.station.name, u.station.city?.name].filter(Boolean).join(", ")],
    }));
