import { LoaderCircle, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import Panel from "@/components/common/Panel.jsx";
import RunningCard from "@/components/features/runningCard/RunningCard.jsx";

/** The next alarm level's card, with the truck choice per station and the Raise button. */
function RaiseAlarm({ incident, next, truckPicks, onPickTruck, busy, onRaise }) {
  const stations = next.stations.length;
  return (
    <Panel
      title={`Next: ${next.alarmLevel}`}
      meta={stations ? `${stations} station${stations === 1 ? "" : "s"} not yet on this incident` : "no more stations in range"}
      flush
    >
      <RunningCard
        runningCard={stations ? [{ alarmLevel: next.alarmLevel, index: incident.alarmIndex + 1, stations: next.stations }] : []}
        truckPicks={truckPicks}
        onPickTruck={onPickTruck}
      />
      <div className='border-t p-3'>
        <Button className='h-11 w-full text-base font-semibold' disabled={busy || stations === 0} onClick={onRaise}>
          {busy ? <LoaderCircle className='animate-spin' /> : <Siren className='size-5' />} Raise to {next.alarmLevel}
        </Button>
      </div>
    </Panel>
  );
}

export default RaiseAlarm;
