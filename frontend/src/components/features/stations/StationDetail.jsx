import { ChevronLeft, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Panel from "@/components/common/Panel.jsx";
import KeyValue from "@/components/common/KeyValue.jsx";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import { TRUCK_STATUS } from "@/constants/truck.js";
import TruckList from "./TruckList.jsx";

/** The selected station: its facts and editor actions, a status count, and its vehicle inventory. */
function StationDetail({ station, editable, onBack, onEdit, onDeactivate, onAddTruck, onEditTruck }) {
  const counts = Object.keys(TRUCK_STATUS)
    .map((s) => [s, station.trucks.filter((t) => t.status === s).length])
    .filter(([, n]) => n);
  return (
    <div className='flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto'>
      <button onClick={onBack} className='flex w-fit items-center gap-1 text-sm text-muted-foreground lg:hidden'>
        <ChevronLeft className='size-4' /> Stations
      </button>
      <Panel
        title={station.name}
        actions={
          editable && (
            <>
              <Button variant='outline' size='sm' onClick={onEdit}>
                <Pencil /> Edit
              </Button>
              <Button variant='outline' size='sm' className='text-destructive' onClick={onDeactivate}>
                Deactivate
              </Button>
            </>
          )
        }
      >
        <KeyValue
          columns={2}
          items={[
            { label: "City", value: station.city?.name ?? "No city set" },
            { label: "Address", value: station.address || "No address" },
            { label: "Contact", value: station.contactNumber },
            { label: "Coordinates", value: `${station.lat.toFixed(5)}, ${station.lng.toFixed(5)}`, mono: true },
          ]}
        />
      </Panel>

      <Panel
        title='Vehicle inventory'
        meta={
          <span className='inline-flex flex-wrap gap-1 align-middle'>
            {counts.map(([s, n]) => (
              <StatusBadge key={s} tone={TRUCK_STATUS[s].tone}>
                {n} {TRUCK_STATUS[s].label}
              </StatusBadge>
            ))}
          </span>
        }
        actions={
          editable && (
            <Button size='sm' onClick={onAddTruck}>
              <Plus /> Add truck
            </Button>
          )
        }
        flush
      >
        <TruckList trucks={station.trucks} editable={editable} onEditTruck={onEditTruck} />
      </Panel>
    </div>
  );
}

export default StationDetail;
