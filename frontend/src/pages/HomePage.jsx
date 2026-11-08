import { useState } from "react";
import MapComponent from "@/components/common/MapComponent.jsx";
import RunningCard from "@/components/features/runningCard/RunningCard.jsx";
import LocationSearch from "@/components/features/runningCard/locationSearch/LocationSearch.jsx";
import PinnedLocation from "@/components/features/runningCard/PinnedLocation.jsx";
import ViewOnlyNotice from "@/components/features/runningCard/ViewOnlyNotice.jsx";
import DispatchBar from "@/components/features/runningCard/DispatchBar.jsx";
import DispatchDialog from "@/components/features/runningCard/DispatchDialog.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetRunningCard from "@/hooks/runningCard/useGetRunningCard.js";
import { canDispatchIn } from "@/utils/permissions.js";

/** The running card: pick a location, see the nearest available stations per alarm level, dispatch. */
function HomePage() {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [label, setLabel] = useState("");
  const [barangayId, setBarangayId] = useState(null);
  const [picked, setPicked] = useState({ card: null, picks: {} }); // stationId -> truckId; default is the station's first available truck
  const [dispatchForm, setDispatchForm] = useState(null); // { locationLabel, notes }

  const { data, isPending, isPlaceholderData } = useGetRunningCard(location);
  const loading = isPlaceholderData || (!!location && isPending); // not for a background refresh: the card stays usable
  const runningCard = data?.alarms ?? null;
  const city = data?.city ?? null; // NCR city of the pin; its dispatchers own the incident
  const canDispatch = canDispatchIn(user, city?.id);
  // Picks belong to the card they were made on: a new location or a changed truck status starts over.
  const truckPicks = picked.card === runningCard ? picked.picks : {};

  const handleSelect = (point, text, pickedBarangayId = null) => {
    setLocation(point);
    setLabel(text);
    setBarangayId(pickedBarangayId);
  };

  return (
    <div className='grid grid-cols-1 gap-4 p-4 md:p-6 xl:grid-cols-[minmax(380px,5fr)_7fr]'>
      <section className='flex flex-col gap-3'>
        <LocationSearch onSelect={handleSelect} />
        <div className='h-72 overflow-hidden rounded-xl border sm:h-96 xl:h-[520px]'>
          <MapComponent position={location} onChange={(p) => handleSelect(p, "Pinned on map")} />
        </div>
        <PinnedLocation location={location} label={label} city={city} />
      </section>

      <section className='flex flex-col gap-3'>
        {location && !loading && !canDispatch && <ViewOnlyNotice city={city} />}
        {runningCard?.length > 0 && canDispatch && (
          <DispatchBar alarmLevel={runningCard[0].alarmLevel} disabled={loading} onDispatch={() => setDispatchForm({ locationLabel: label, notes: "" })} />
        )}
        <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
          <RunningCard
            runningCard={runningCard}
            truckPicks={truckPicks}
            onPickTruck={canDispatch ? (stationId, truckId) => setPicked({ card: runningCard, picks: { ...truckPicks, [stationId]: truckId } }) : undefined}
          />
        </div>
      </section>

      <DispatchDialog
        initial={dispatchForm}
        alarmLevel={runningCard?.[0]?.alarmLevel}
        location={location}
        label={label}
        barangayId={barangayId}
        truckPicks={truckPicks}
        onClose={() => setDispatchForm(null)}
      />
    </div>
  );
}

export default HomePage;
