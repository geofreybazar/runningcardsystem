import { TriangleAlert, Truck } from "lucide-react";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import EmptyState from "@/components/common/EmptyState.jsx";
import { cn } from "@/lib/utils";
import { alarmTone } from "@/utils/alarm.js";
import { districtName } from "@/utils/permissions.js";
import { TRUCK_TYPES } from "@/constants/truck.js";
import { STRAIGHT_LINE_HINT, anyStraightLine, isStraightLine } from "@/utils/distance.js";

const truckLabel = (t) => `${t.callSign} · ${TRUCK_TYPES[t.type]}`;

/**
 * The running card: one section per alarm level (its header on the escalation scale), stations nearest first.
 * Each row: order, district colour, station and city, the truck that goes (pickable when the station has several),
 * road distance (km). Every listed truck is Available: the card is built from live status.
 */
function RunningCard({ runningCard, truckPicks = {}, onPickTruck }) {
  if (!runningCard) return null;
  if (runningCard.length === 0) {
    return (
      <EmptyState icon={Truck} title='No station with an available truck is within range.'>
        Every truck nearby may be responding, deployed or out of service. Check Stations &amp; Trucks.
      </EmptyState>
    );
  }

  let order = 0;
  return (
    <div className='flex flex-col'>
      {anyStraightLine(runningCard.flatMap((a) => a.stations)) && (
        <p role='status' className='flex items-start gap-2 border-b border-l-2 border-l-warning bg-warning/10 px-4 py-1.5 text-xs'>
          <TriangleAlert className='mt-px size-3.5 shrink-0 text-warning-foreground' aria-hidden='true' />
          Road routing is unavailable, so distances marked ≈ are straight-line and the order may not match the roads.
        </p>
      )}
      {runningCard.map((alarm, i) => (
        <section key={alarm.alarmLevel} aria-label={alarm.alarmLevel} className='border-b last:border-b-0'>
          <header className={cn("flex items-center justify-between px-4 py-1.5", alarmTone(alarm.index ?? i))}>
            <span className='font-data text-base font-semibold tracking-wide'>{alarm.alarmLevel}</span>
            <span className='text-xs opacity-85'>
              {alarm.stations.length} station{alarm.stations.length === 1 ? "" : "s"}
            </span>
          </header>
          <ol>
            {alarm.stations.map((station) => {
              order += 1;
              const truckId = truckPicks[station.id] ?? station.trucks[0]?.id;
              const truck = station.trucks.find((t) => t.id === truckId) ?? station.trucks[0];
              return (
                <li key={station.id} className='grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-2 border-t px-4 py-2 first:border-t-0'>
                  <span className='font-data text-sm text-muted-foreground'>{order}</span>
                  <div className='min-w-0'>
                    <div className='flex min-w-0 items-center gap-1.5'>
                      <span
                        className='size-2.5 shrink-0 rounded-[2px]'
                        style={{ background: station.district.color }}
                        title={districtName(station.district)}
                        aria-label={districtName(station.district)}
                      />
                      <span className='truncate text-sm font-medium'>{station.name}</span>
                      {station.city && <span className='hidden truncate text-xs text-muted-foreground sm:inline'>{station.city.name}</span>}
                    </div>
                    {onPickTruck && station.trucks.length > 1 ? (
                      <SimpleSelect
                        value={truckId}
                        onChange={(id) => onPickTruck(station.id, id)}
                        className='mt-1 h-7 w-full max-w-64 text-xs'
                        aria-label={`Truck from ${station.name}`}
                        options={station.trucks.map((t) => ({ value: t.id, label: truckLabel(t) }))}
                      />
                    ) : (
                      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                        <span className='size-1.5 rounded-full bg-success' title='Available' aria-hidden='true' />
                        <span className='truncate font-data'>{truckLabel(truck)}</span>
                        {station.trucks.length > 1 && <span className='text-xs'>+{station.trucks.length - 1} more</span>}
                      </div>
                    )}
                  </div>
                  <span
                    className='text-right font-data text-base text-foreground'
                    title={isStraightLine(station) ? STRAIGHT_LINE_HINT : "Distance by road"}
                  >
                    {isStraightLine(station) && <span className='mr-0.5 text-warning-foreground'>≈</span>}
                    {station.distance.toFixed(1)}
                    <span className='ml-0.5 text-xs text-muted-foreground'>km</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default RunningCard;
