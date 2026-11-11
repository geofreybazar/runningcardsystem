import { useState } from "react";
import { LoaderCircle, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Panel from "@/components/common/Panel.jsx";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import { SPECIAL_TRUCK_TYPES, TRUCK_TYPES } from "@/constants/truck.js";
import { districtName } from "@/utils/permissions.js";
import useGetSpecialUnits from "@/hooks/incidents/useGetSpecialUnits.js";
import useRequestSpecialUnit from "@/hooks/incidents/useRequestSpecialUnit.js";
import { STRAIGHT_LINE_HINT, isStraightLine } from "@/utils/distance.js";

const TYPE_OPTIONS = SPECIAL_TRUCK_TYPES.map((t) => ({ value: t, label: TRUCK_TYPES[t] }));

/**
 * Special units (ladder, rescue, CSSR, ambulance) are not on the running card: the fire city's dispatcher
 * picks a type and sends one of the nearest available units, which goes out at once.
 */
function RequestSpecialUnit({ incident, disabled }) {
  const [type, setType] = useState("");
  const { data: stations, isFetching } = useGetSpecialUnits(incident.id, type);
  const request = useRequestSpecialUnit();
  const busy = disabled || request.isPending;

  return (
    <Panel title='Request a special unit' bodyClassName='grid gap-3 p-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
        <UserPlus className='hidden size-4 shrink-0 text-info-foreground sm:block' />
        <p className='flex-1 text-xs text-muted-foreground'>Ladders, rescue, CSSR and ambulances are not on the running card. An available unit is sent right away.</p>
        <SimpleSelect value={type} onChange={setType} options={TYPE_OPTIONS} placeholder='Choose a unit type' className='w-full bg-card sm:w-48' aria-label='Special unit type' />
      </div>

      {type && isFetching && !stations && <Skeleton className='h-16 w-full' />}
      {type && stations?.length === 0 && <p className='rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground'>No available {TRUCK_TYPES[type]} within range.</p>}
      {type && stations?.length > 0 && (
        <ul className='divide-y rounded-md border'>
          {stations.flatMap((station) =>
            station.trucks.map((truck) => (
              <li key={truck.id} className='flex items-center gap-3 px-3 py-2'>
                <span className='size-2.5 shrink-0 rounded-[2px]' style={{ background: station.district.color }} title={districtName(station.district)} />
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-sm font-medium'>
                    {station.name}
                    {station.city && <span className='font-normal text-muted-foreground'>, {station.city.name}</span>}
                  </div>
                  <div className='truncate font-data text-sm text-muted-foreground'>
                    {truck.callSign}
                    {truck.plateNumber && ` · ${truck.plateNumber}`}
                  </div>
                </div>
                <span className='shrink-0 font-data text-base text-muted-foreground' title={isStraightLine(station) ? STRAIGHT_LINE_HINT : "Distance by road"}>
                  {isStraightLine(station) && <span className='mr-0.5 text-warning-foreground'>≈</span>}
                  {station.distance.toFixed(1)} km
                </span>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={busy}
                  onClick={() => request.mutate({ id: incident.id, truckId: truck.id, label: `${TRUCK_TYPES[type]} ${truck.callSign}` })}
                >
                  {request.isPending && request.variables?.truckId === truck.id ? <LoaderCircle className='animate-spin' /> : <Send />} Send
                </Button>
              </li>
            )),
          )}
        </ul>
      )}
    </Panel>
  );
}

export default RequestSpecialUnit;
