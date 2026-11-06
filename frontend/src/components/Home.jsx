import { useMemo, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import variables from "../variables/variables.js";
import Card from "./Card.jsx";
import LocationSearch from "./LocationSearch.jsx";
import MapComponent from "./MapComponent.jsx";

const { buildRunningCard } = variables;

function Home() {
  const [location, setLocation] = useState(null);
  const [label, setLabel] = useState("");
  const runningCard = useMemo(() => buildRunningCard(location), [location]);

  const handleSelect = (point, text) => {
    setLocation(point);
    setLabel(text);
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_API}>
      <div>
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

          <section>
            <Card runningCard={runningCard} />
          </section>
        </main>
      </div>
    </APIProvider>
  );
}

export default Home;
