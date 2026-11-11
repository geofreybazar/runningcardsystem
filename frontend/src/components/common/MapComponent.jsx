import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { Flag, Flame } from "lucide-react";
import useTheme from "@/hooks/useTheme.js";
import { useEffect, useState } from "react";
import FireTruckIcon from "./FireTruckIcon.jsx";

const DEFAULT_CENTER = { lat: 14.6091, lng: 121.0223 };
// Marker content is ordinary DOM, so theme tokens apply (and follow dark mode).
const BFP_RED = "var(--primary)";
const DIMMED = "var(--muted-foreground)"; // a station with no available truck

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

/** A special event's venue (ASEAN, SONA, …): a flag, so it isn't mistaken for a fire or a truck. */
const EventPin = () => (
  <MarkerPin color={BFP_RED} size={34}>
    <Flag className='size-4 text-gold' fill='currentColor' />
  </MarkerPin>
);

const StationPin = ({ color }) => (
  <MarkerPin color={color} size={30}>
    <FireTruckIcon className='size-4' />
  </MarkerPin>
);

/** A truck/station pin with a card above it while hovered: the title in bold, then one line per detail. */
function TooltipPin({ color, dimmed, title, details = [], open }) {
  return (
    <div className='relative' aria-label={[title, ...details].join(", ")}>
      {open && (
        <div
          role='tooltip'
          className='pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-max max-w-64 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md'
        >
          <div className='font-condensed text-sm font-semibold'>{title}</div>
          {details.filter(Boolean).map((d, i) => (
            <div key={i} className='text-muted-foreground'>
              {d}
            </div>
          ))}
        </div>
      )}
      <StationPin color={dimmed ? DIMMED : color} />
    </div>
  );
}

/**
 * The main pin (draggable when onChange is given): a fire, a station (`kind="station"`), a special event's venue
 * (`kind="deployment"`, a flag), or one deployed truck's post (`kind="post"`).
 * Optional markers ({ id, position, color, dimmed?, title, details? }) show a fire truck in the district colour (grey when
 * dimmed), with a tooltip (title + detail lines) on hover, or on tap for touch screens; the open one is raised above its
 * neighbours. With markers, the map fits them all (and the pin, if any); otherwise it follows the pin.
 */
function MapComponent({ position, onChange, markers = [], kind = "fire", overlayTop = false }) {
  const map = useMap();
  const [theme] = useTheme();
  const markerKey = markers.map((m) => m.id).join(",");
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!map) return;
    if (markers.length) {
      const bounds = new window.google.maps.LatLngBounds();
      if (position) bounds.extend(position);
      markers.forEach((m) => bounds.extend(m.position));
      map.fitBounds(bounds, 48);
      return;
    }
    if (!position) return;
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
      // Our own controls sit over the top of the map (the Running Card search): keep Google's out of the way.
      mapTypeControl={!overlayTop}
      fullscreenControl={!overlayTop}
      onClick={(e) => {
        setHovered(null); // a tap on the map closes a tapped-open tooltip
        if (onChange && e.detail.latLng) onChange(e.detail.latLng);
      }}
    >
      {markers.map((m) => (
        <AdvancedMarker
          key={m.id}
          position={m.position}
          zIndex={hovered === m.id ? 20 : undefined}
          onMouseEnter={() => setHovered(m.id)}
          onMouseLeave={() => setHovered((h) => (h === m.id ? null : h))}
          onClick={() => setHovered((h) => (h === m.id ? null : m.id))} // touch screens have no hover
        >
          <TooltipPin color={m.color} dimmed={m.dimmed} title={m.title} details={m.details} open={hovered === m.id} />
        </AdvancedMarker>
      ))}
      {position && (
        <AdvancedMarker
          position={position}
          draggable={!!onChange}
          onDragEnd={(e) => onChange?.(e.latLng.toJSON())}
          zIndex={10}
          title={{ station: "Station location", deployment: "Event location", post: "Truck post" }[kind] ?? "Fire location"}
        >
          {kind === "fire" ? <FirePin /> : kind === "deployment" ? <EventPin /> : <StationPin color={BFP_RED} />}
        </AdvancedMarker>
      )}
    </Map>
  );
}

export default MapComponent;
