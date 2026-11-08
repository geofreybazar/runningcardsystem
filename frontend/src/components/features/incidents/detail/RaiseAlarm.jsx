import { LoaderCircle, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import RunningCard from "@/components/features/runningCard/RunningCard.jsx";

/** The next alarm level's card, with the truck choice per station and the Raise button. */
function RaiseAlarm({ incident, next, truckPicks, onPickTruck, busy, onRaise }) {
  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-col gap-3 rounded-xl border border-primary/20 bg-accent p-3 sm:flex-row sm:items-center'>
        <Siren className='hidden size-5 shrink-0 text-primary sm:block' />
        <p className='flex-1 text-sm'>
          Next: <b>{next.alarmLevel}</b> — the nearest stations not yet on this incident, from live truck status.
        </p>
        <Button disabled={busy || next.stations.length === 0} onClick={onRaise}>
          {busy && <LoaderCircle className='animate-spin' />} Raise to {next.alarmLevel}
        </Button>
      </div>
      <RunningCard
        runningCard={next.stations.length ? [{ alarmLevel: next.alarmLevel, index: incident.alarmIndex + 1, stations: next.stations }] : []}
        truckPicks={truckPicks}
        onPickTruck={onPickTruck}
      />
    </section>
  );
}

export default RaiseAlarm;
