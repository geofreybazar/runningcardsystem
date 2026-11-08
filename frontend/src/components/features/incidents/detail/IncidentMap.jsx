import { useMemo } from "react";
import MapComponent from "@/components/common/MapComponent.jsx";

/** One pin per responding station, in its district colour. */
function stationMarkers(units) {
  const byStation = new Map(units.map((u) => [u.station.id, u.station]));
  return [...byStation.values()].map((s) => ({ id: s.id, position: { lat: s.lat, lng: s.lng }, color: s.district.color, title: s.name }));
}

/** The fire and its responding stations. */
function IncidentMap({ incident }) {
  const { lat, lng } = incident;
  const position = useMemo(() => ({ lat, lng }), [lat, lng]); // stable, so the map only refits when something changes
  return <MapComponent position={position} markers={stationMarkers(incident.units)} />;
}

export default IncidentMap;
