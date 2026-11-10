import { useState } from "react";
import { LoaderCircle, MapPinned } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MapComponent from "@/components/common/MapComponent.jsx";
import EmptyState from "@/components/common/EmptyState.jsx";
import RunningCard from "@/components/features/runningCard/RunningCard.jsx";
import CardSummary from "@/components/features/runningCard/CardSummary.jsx";
import LocationSearch from "@/components/features/runningCard/locationSearch/LocationSearch.jsx";
import PinnedLocation from "@/components/features/runningCard/PinnedLocation.jsx";
import ViewOnlyNotice from "@/components/features/runningCard/ViewOnlyNotice.jsx";
import DispatchBar from "@/components/features/runningCard/DispatchBar.jsx";
import DispatchDialog from "@/components/features/runningCard/DispatchDialog.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetRunningCard from "@/hooks/runningCard/useGetRunningCard.js";
import { canDispatchIn } from "@/utils/permissions.js";
import { cn } from "@/lib/utils";

/**
 * The dispatch workspace. Wide screens: the map fills the left with the location search over it; the dispatch panel
 * on the right holds the location, what is in range, the card, and the Dispatch button pinned at its foot.
 * Narrow screens: one column (search and map, then the panel) with the Dispatch button pinned to the bottom.
 */
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
  const firstAlarm = runningCard?.[0];

  const handleSelect = (point, text, pickedBarangayId = null) => {
    setLocation(point);
    setLabel(text);
    setBarangayId(pickedBarangayId);
  };

  return (
    <div className='flex flex-col xl:h-[calc(100svh-3rem)] xl:flex-row'>
      {/* Map pane */}
      <section aria-label='Map' className='relative h-80 shrink-0 border-b sm:h-[26rem] xl:h-auto xl:min-w-0 xl:flex-1 xl:border-r xl:border-b-0'>
        <div className='absolute inset-0'>
          <MapComponent position={location} onChange={(p) => handleSelect(p, "Pinned on map")} overlayTop />
        </div>
        <div className='absolute inset-x-3 top-3 z-10 max-w-2xl'>
          <LocationSearch onSelect={handleSelect} />
        </div>
        {location && (
          <p className='absolute bottom-3 left-3 z-10 hidden rounded-sm bg-card/95 px-2 py-1 text-xs text-muted-foreground shadow sm:block'>
            Drag the pin or click the map to adjust the location.
          </p>
        )}
      </section>

      {/* Dispatch panel */}
      <aside aria-label='Running card' className='flex min-h-0 flex-col bg-card xl:w-[30rem] xl:shrink-0'>
        <div className='relative min-h-0 flex-1 xl:overflow-y-auto' aria-busy={loading}>
          {!location ? (
            <EmptyState icon={MapPinned} title='Pick the fire location' className='py-16'>
              Search an address, landmark or barangay, type coordinates like <span className='font-data'>14.5916, 121.0031</span> and press Enter,
              use <b>By district</b>, or click the map. The nearest stations with an available truck appear here, by alarm level.
            </EmptyState>
          ) : (
            <>
              <PinnedLocation location={location} label={label} city={city} />
              {loading && !runningCard ? (
                <div className='grid gap-2 p-4' aria-label='Loading the running card'>
                  <Skeleton className='h-12 w-full rounded-sm' />
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className='h-10 w-full rounded-sm' />
                  ))}
                </div>
              ) : (
                <div className={cn("relative transition-opacity", loading && "pointer-events-none opacity-60")}>
                  {loading && (
                    <div className='absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 bg-card/80 py-1 text-xs text-muted-foreground'>
                      <LoaderCircle className='size-3.5 animate-spin' /> Updating for the new location…
                    </div>
                  )}
                  {firstAlarm && <CardSummary runningCard={runningCard} />}
                  <RunningCard
                    runningCard={runningCard}
                    truckPicks={truckPicks}
                    onPickTruck={canDispatch ? (stationId, truckId) => setPicked({ card: runningCard, picks: { ...truckPicks, [stationId]: truckId } }) : undefined}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {location && (canDispatch ? firstAlarm : !loading) && (
          <footer className='sticky bottom-0 z-20 border-t bg-card/95 p-3 backdrop-blur xl:static'>
            {canDispatch ? (
              <DispatchBar
                alarmLevel={firstAlarm.alarmLevel}
                trucks={firstAlarm.stations.length}
                disabled={loading}
                onDispatch={() => setDispatchForm({ locationLabel: label, notes: "" })}
              />
            ) : (
              <ViewOnlyNotice city={city} />
            )}
          </footer>
        )}
      </aside>

      <DispatchDialog
        initial={dispatchForm}
        alarmLevel={firstAlarm?.alarmLevel}
        stations={firstAlarm?.stations}
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
