import { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { api } from "../api/client.js";
import Card from "./Card.jsx";
import LocationSearch from "./LocationSearch.jsx";
import MapComponent from "./MapComponent.jsx";

function Home() {
  const [location, setLocation] = useState(null);
  const [label, setLabel] = useState("");
  const [runningCard, setRunningCard] = useState(null);
  const [truckPicks, setTruckPicks] = useState({}); // stationId -> truckId; default is the station's first available truck
  const [error, setError] = useState("");

  // The card is built on the server from live truck status, so it is refetched for every new location.
  useEffect(() => {
    if (!location) return;
    let stale = false;
    setError("");
    api(`/running-card?lat=${location.lat}&lng=${location.lng}`)
      .then((card) => {
        if (stale) return;
        setRunningCard(card);
        setTruckPicks({});
      })
      .catch((e) => !stale && setError(e.message));
    return () => {
      stale = true;
    };
  }, [location]);

  const handleSelect = (point, text) => {
    setLocation(point);
    setLabel(text);
  };

  return (
    <main className='grid grid-cols-1 gap-6 p-4 lg:grid-cols-[minmax(360px,2fr)_3fr] lg:p-6'>
      <section className='flex flex-col gap-3'>
        <LocationSearch onSelect={handleSelect} />
        <div className='h-[420px] overflow-hidden rounded border lg:h-[560px]'>
          <MapComponent position={location} onChange={(p) => handleSelect(p, "Pinned on map")} />
        </div>
        {location && (
          <div className='text-sm text-gray-700'>
            <div className='font-medium'>{label}</div>
            <div className='font-mono'>
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        )}
        <p className='text-xs text-gray-500'>Click the map or drag the pin to adjust the location.</p>
      </section>

      <section className='flex flex-col gap-3'>
        {error && <Alert severity='error'>{error}</Alert>}
        <Card
          runningCard={runningCard}
          truckPicks={truckPicks}
          onPickTruck={(stationId, truckId) => setTruckPicks((p) => ({ ...p, [stationId]: truckId }))}
        />
      </section>
    </main>
  );
}

export default Home;
