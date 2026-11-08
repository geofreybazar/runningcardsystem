import { Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import IconAction from "@/components/common/IconAction.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import TruckStatusBadge from "@/components/common/TruckStatusBadge.jsx";
import useChangeTruckStatus from "@/hooks/stations/useChangeTruckStatus.js";
import useRemoveTruck from "@/hooks/stations/useRemoveTruck.js";
import { OWNERSHIP, TRUCK_STATUS, TRUCK_TYPES, toOptions } from "@/constants/truck.js";

/** A station's trucks: cards on phones, a table on wider screens. Editors change status, edit and remove. */
function TruckList({ trucks, editable, onEditTruck }) {
  const { mutate: changeStatus } = useChangeTruckStatus();
  const { mutate: removeTruck } = useRemoveTruck();

  return trucks.length === 0 ? (
    <Alert>
      <AlertDescription>No trucks. This station is skipped on running cards until a truck is added.</AlertDescription>
    </Alert>
  ) : (
    <>
      <div className='grid gap-2 md:hidden'>
        {trucks.map((t) => (
          <div key={t.id} className='rounded-lg border p-3'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <div className='break-words font-condensed text-base font-semibold'>{t.callSign}</div>
                <div className='text-xs text-muted-foreground'>
                  {[TRUCK_TYPES[t.type], OWNERSHIP[t.ownership], t.plateNumber, t.waterCapacityLiters != null && `${t.waterCapacityLiters} L`]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
              {editable && (
                <div className='flex'>
                  <IconAction label='Edit' onClick={() => onEditTruck(t)}>
                    <Pencil />
                  </IconAction>
                  <IconAction label='Remove' destructive onClick={() => removeTruck(t.id)}>
                    <Trash2 />
                  </IconAction>
                </div>
              )}
            </div>
            <div className='mt-2'>
              {editable ? (
                <SimpleSelect
                  value={t.status}
                  onChange={(status) => changeStatus({ truck: t, status })}
                  className='h-8 w-full'
                  options={toOptions(TRUCK_STATUS)}
                />
              ) : (
                <TruckStatusBadge status={t.status} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className='hidden overflow-x-auto md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Call sign</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead className='text-right'>Water (L)</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              {editable && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trucks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='max-w-48 truncate font-condensed text-base font-semibold' title={t.callSign}>
                  {t.callSign}
                </TableCell>
                <TableCell>{TRUCK_TYPES[t.type]}</TableCell>
                <TableCell>{t.plateNumber ?? "—"}</TableCell>
                <TableCell className='text-right tabular-nums'>{t.waterCapacityLiters ?? "—"}</TableCell>
                <TableCell>{OWNERSHIP[t.ownership]}</TableCell>
                <TableCell>
                  {editable ? (
                    <SimpleSelect
                      value={t.status}
                      onChange={(status) => changeStatus({ truck: t, status })}
                      className='h-8 w-40'
                      options={toOptions(TRUCK_STATUS)}
                    />
                  ) : (
                    <TruckStatusBadge status={t.status} />
                  )}
                </TableCell>
                {editable && (
                  <TableCell className='text-right whitespace-nowrap'>
                    <IconAction label='Edit' onClick={() => onEditTruck(t)}>
                      <Pencil />
                    </IconAction>
                    <IconAction label='Remove' destructive onClick={() => removeTruck(t.id)}>
                      <Trash2 />
                    </IconAction>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default TruckList;
