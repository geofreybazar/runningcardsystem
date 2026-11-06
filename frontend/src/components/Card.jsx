import { Truck } from "lucide-react";
import { Card as Panel } from "@/components/ui/card";
import SimpleSelect from "@/components/SimpleSelect.jsx";
import { cn } from "@/lib/utils";
import { TRUCK_TYPES } from "@/labels.js";

const truckLabel = (t) => `${t.callSign} · ${TRUCK_TYPES[t.type]}`;

// Alarms escalate visually: red for the numbered alarms, dark for task forces, black for general alarm.
const headerTone = (i) => (i < 5 ? "bg-primary text-primary-foreground" : i < 9 ? "bg-neutral-800 text-white" : "bg-black text-white");

function Empty({ children }) {
  return (
    <div className='flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground'>
      <Truck className='size-8 opacity-40' />
      {children}
    </div>
  );
}

/** The running card: one panel per alarm level, nearest stations first. */
function Card({ runningCard, truckPicks = {}, onPickTruck }) {
  if (!runningCard) return <Empty>Search a location to generate the running card.</Empty>;
  if (runningCard.length === 0) return <Empty>No station with an available truck is within range.</Empty>;

  const districts = new Map(runningCard.flatMap((a) => a.stations.map((s) => [s.district.code, s.district])));

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
        {[...districts.values()]
          .sort((a, b) => a.code - b.code)
          .map((d) => (
            <span key={d.code} className='flex items-center gap-1.5'>
              <span className='size-2.5 rounded-full' style={{ background: d.color }} />
              {d.name}
            </span>
          ))}
      </div>

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
        {runningCard.map((alarm, i) => (
          <Panel key={alarm.alarmLevel} className='gap-0 overflow-hidden py-0'>
            <div className={cn("flex items-center justify-between px-4 py-2 text-sm font-semibold", headerTone(i))}>
              {alarm.alarmLevel}
              <span className='text-xs font-normal opacity-80'>{alarm.stations.length} stations</span>
            </div>
            <ul className='divide-y'>
              {alarm.stations.map((station) => {
                const truckId = truckPicks[station.id] ?? station.trucks[0]?.id;
                const truck = station.trucks.find((t) => t.id === truckId) ?? station.trucks[0];
                return (
                  <li key={station.id} className='flex items-center gap-3 px-4 py-2.5'>
                    <span
                      className='size-2.5 shrink-0 rounded-full ring-2 ring-background'
                      style={{ background: station.district.color }}
                      title={station.district.name}
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-sm font-medium'>{station.name}</div>
                      {onPickTruck && station.trucks.length > 1 ? (
                        <SimpleSelect
                          value={truckId}
                          onChange={(id) => onPickTruck(station.id, id)}
                          className='mt-1 h-7 w-full max-w-64 text-xs'
                          options={station.trucks.map((t) => ({ value: t.id, label: truckLabel(t) }))}
                        />
                      ) : (
                        <div className='truncate text-xs text-muted-foreground'>{truckLabel(truck)}</div>
                      )}
                    </div>
                    <span className='shrink-0 text-sm tabular-nums text-muted-foreground'>{station.distance.toFixed(2)} km</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export default Card;
