import { useEffect } from "react";
import { AdvancedMarker, AdvancedMarkerAnchorPoint, Map, useMap } from "@vis.gl/react-google-maps";
import { useTheme } from "@/components/Alarm.jsx";

const NCR_CENTER = { lat: 14.6091, lng: 121.0223 };

/** Fits the map to the fire locations whenever they change. */
function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !points.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, 40);
    if (points.length === 1) map.setZoom(15);
  }, [map, points]);
  return null;
}

/**
 * Fire locations as small translucent dots: where fires cluster, overlapping dots read darker.
 * (Google's heat-map layer has been removed from the Maps API, so no extra library.)
 */
function IncidentDotsMap({ points }) {
  const [theme] = useTheme();
  return (
    <div className='h-80 overflow-hidden rounded-lg border' role='img' aria-label={`Map of ${points.length} fire locations`}>
      <Map
        key={theme}
        colorScheme={theme === "dark" ? "DARK" : "LIGHT"}
        mapId='1135125'
        style={{ width: "100%", height: "100%" }}
        defaultCenter={NCR_CENTER}
        defaultZoom={11}
        gestureHandling='cooperative'
        disableDefaultUI
        zoomControl
      >
        {points.map(([lat, lng], i) => (
          <AdvancedMarker key={i} position={{ lat, lng }} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
            <span className='block size-2.5 rounded-full border border-white/70 bg-chart-bar opacity-45' />
          </AdvancedMarker>
        ))}
        <FitToPoints points={points} />
      </Map>
    </div>
  );
}

export default IncidentDotsMap;
