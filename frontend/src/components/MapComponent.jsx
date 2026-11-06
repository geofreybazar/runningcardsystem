import { Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

const DEFAULT_CENTER = { lat: 14.6091, lng: 121.0223 };

function MapComponent({ position, onChange }) {
  const map = useMap();

  // Follow the pin when it is set from the search box.
  useEffect(() => {
    if (!map || !position) return;
    map.panTo(position);
    if (map.getZoom() < 15) map.setZoom(15);
  }, [map, position]);

  return (
    <Map
      mapId='1135125'
      style={{ width: "100%", height: "100%" }}
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={12}
      gestureHandling='greedy'
      onClick={(e) => e.detail.latLng && onChange(e.detail.latLng)}
    >
      {position && (
        <AdvancedMarker
          position={position}
          draggable
          onDragEnd={(e) => onChange(e.latLng.toJSON())}
        >
          <Pin background='#b91c1c' borderColor='#7f1d1d' glyphColor='#f2c94c' />
        </AdvancedMarker>
      )}
    </Map>
  );
}

export default MapComponent;
