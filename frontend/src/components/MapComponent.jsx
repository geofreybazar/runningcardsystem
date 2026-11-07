import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { Flame } from "lucide-react";
import { useTheme } from "@/components/Alarm.jsx";
import { useEffect } from "react";

const DEFAULT_CENTER = { lat: 14.6091, lng: 121.0223 };
const BFP_RED = "#b91c1c";

/** Lucide has no fire truck: drawn in its style (24 grid, 2px round strokes) — ladder on top, body, cab, wheels. */
export function FireTruckIcon({ className }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M2 5h10M2 8h10M5 5v3M9 5v3' />
      <path d='M4 17H2v-6h12v6H8M14 11h4l3 3v3h-2' />
      <circle cx='6' cy='17' r='2' />
      <circle cx='17' cy='17' r='2' />
      <path d='M14 17h1' />
    </svg>
  );
}

/** A round badge with a pointer below; AdvancedMarker anchors its content at the bottom centre, i.e. the tip. */
function MarkerPin({ color, size, children }) {
  return (
    <div className='flex flex-col items-center drop-shadow-md'>
      <div className='flex items-center justify-center rounded-full border-2 border-white text-white' style={{ background: color, width: size, height: size }}>
        {children}
      </div>
      <div className='-mt-0.5 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent' style={{ borderTopColor: color }} />
    </div>
  );
}

const FirePin = () => (
  <MarkerPin color={BFP_RED} size={38}>
    <Flame className='size-5 text-gold' fill='currentColor' />
  </MarkerPin>
);

const StationPin = ({ color }) => (
  <MarkerPin color={color} size={30}>
    <FireTruckIcon className='size-4' />
  </MarkerPin>
);

/**
 * The main pin (draggable when onChange is given): a fire, or a station when `kind="station"` (station form).
 * Optional station markers ({ id, position, color, title }) show a fire truck in the district colour.
 * With markers, the map fits them all; otherwise it follows the pin.
 */
function MapComponent({ position, onChange, markers = [], kind = "fire" }) {
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
          <StationPin color={m.color} />
        </AdvancedMarker>
      ))}
      {position && (
        <AdvancedMarker
          position={position}
          draggable={!!onChange}
          onDragEnd={(e) => onChange?.(e.latLng.toJSON())}
          zIndex={10}
          title={kind === "station" ? "Station location" : "Fire location"}
        >
          {kind === "station" ? <StationPin color={BFP_RED} /> : <FirePin />}
        </AdvancedMarker>
      )}
    </Map>
  );
}

export default MapComponent;
