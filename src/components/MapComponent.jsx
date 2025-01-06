import { APIProvider, 
  Map, 
  Marker, 
  AdvancedMarker,
  Pin ,  
  InfoWindow,
  useAdvancedMarkerRef} from '@vis.gl/react-google-maps';
import { useRef, useState, useEffect } from 'react';
import './MapComponent.css'

function MapComponent({setLatitude, setLongtitude, handleGenerateRunningCardFromMap}) {

  const [mapInstance, setMapInstance] = useState(null);
  const searchInputRef = useRef(null);
  const [markerPosition, setMarkerPosition] = useState({ lat: 14.6091, lng: 121.0223  }); 

  const handeGetLongLat = (event) => {
    console.log(event)
    // const lat = event.detail.latLng.lat
    // const lng = event.detail.latLng.lng
  };

  useEffect(() => {
    console.log("Map instance:", mapInstance);
    console.log("Search input ref:", searchInputRef.current);
  
    if (!mapInstance || !searchInputRef.current) {
      console.log("Map or input not ready yet.");
      return;
    }
  
    if (window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'formatted_address'],
      });
      console.log("Autocomplete initialized:", autocomplete);
  
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const location = place.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          setLatitude(lat)
          setLongtitude(lng)
          setMarkerPosition({ lat, lng })    
          mapInstance.map.setCenter({ lat, lng });
          mapInstance.map.setZoom(15);
        } else {
          console.error("No geometry found for this place.");
        }
      });
      
      handleGenerateRunningCardFromMap()
    } else {
      console.error("Google Maps JavaScript API is not loaded.");
    }
  }, [mapInstance, searchInputRef]);

  const handleMarkerDragEnd = (event) => {
    const { lat, lng } = event.latLng.toJSON();
    setMarkerPosition({ lat, lng });
    setLatitude(event.latLng.toJSON().lat)
    setLongtitude(event.latLng.toJSON().lng)
  };

  useEffect(() => {
    handleGenerateRunningCardFromMap()
  }, [markerPosition])
  
  const googleApiKey = import.meta.env.VITE_GOOGLE_API

  return (
    <APIProvider
      apiKey={googleApiKey}
      libraries={['places']}
    >
      {/* Input box */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100 }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a place..."
          style={{ width: '300px', padding: '10px', borderRadius: '5px' }}
        />
      </div> 
      {/* Map */}
      <Map
        mapId="1135125"
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat: 14.6091, lng: 121.0223 }}
        defaultZoom={13}
        onClick={handeGetLongLat}
        onTilesLoaded={(map) => {
          console.log("Map loaded:", map);
          setMapInstance(map); 
        }}
      />
      <AdvancedMarker
        position={markerPosition}
        draggable={true}
        onDragEnd={handleMarkerDragEnd}>
        <Pin
        background={'#22ccff'}
        borderColor={'#1e89a1'}
        glyphColor={'#0f677a'}>
        </Pin>
      </AdvancedMarker>     
    </APIProvider>
  )
}

export default MapComponent