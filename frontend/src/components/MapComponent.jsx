import { Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { useTheme } from "@/components/Alarm.jsx";
import { useEffect } from "react";

const DEFAULT_CENTER = { lat: 14.6091, lng: 121.0223 };

/**
 * The fire pin (draggable when onChange is given), plus optional station markers ({ id, position, color, title }).
 * With markers, the map fits them all; otherwise it follows the pin.
 */
function MapComponent({ position, onChange, markers = [] }) {
  const map = useMap();
  const [theme] = useTheme();
  const markerKey = markers.map((m) => m.id).join(",");

  useEffect(() => {
    if (!map || !position) return;
    if (markers.length) {
      const bounds = new window.google.maps.LatLngBounds(position);
      markers.forEach((m) => bounds.extend(m.position));
      map.fitBounds(bounds, 48);
      return;
    }
    map.panTo(position);
    if (map.getZoom() < 15) map.setZoom(15);
    // markers is summarised by markerKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, position, markerKey]);

  return (
    <Map
      key={theme} // the colour scheme is fixed when the map is created
      colorScheme={theme === "dark" ? "DARK" : "LIGHT"}
      mapId='1135125'
      style={{ width: "100%", height: "100%" }}
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={12}
      gestureHandling='greedy'
      onClick={(e) => onChange && e.detail.latLng && onChange(e.detail.latLng)}
    >
      {markers.map((m) => (
        <AdvancedMarker key={m.id} position={m.position} title={m.title}>
          <Pin background={m.color} borderColor='#ffffff' glyphColor='#ffffff' scale={0.8} />
        </AdvancedMarker>
      ))}
      {position && (
        <AdvancedMarker position={position} draggable={!!onChange} onDragEnd={(e) => onChange?.(e.latLng.toJSON())} zIndex={10}>
          <Pin background='#b91c1c' borderColor='#7f1d1d' glyphColor='#f2c94c' />
        </AdvancedMarker>
      )}
    </Map>
  );
}

export default MapComponent;
