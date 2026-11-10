import { Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import IconAction from "@/components/common/IconAction.jsx";
import useRemoveTruck from "@/hooks/stations/useRemoveTruck.js";
import { OWNERSHIP, TRUCK_TYPES } from "@/constants/truck.js";
import TruckStatusControl from "./TruckStatusControl.jsx";

/** A station's trucks: cards on phones, a table on wider screens. Editors change status, edit and remove (not while deployed). */
function TruckList({ trucks, editable, onEditTruck }) {
  const { mutate: removeTruck } = useRemoveTruck();

  return trucks.length === 0 ? (
    <p className='px-4 py-6 text-center text-sm text-muted-foreground'>No trucks. This station is skipped on running cards until a truck is added.</p>
  ) : (
    <>
      <div className='divide-y md:hidden'>
        {trucks.map((t) => (
          <div key={t.id} className='p-3'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <div className='font-data text-base font-semibold break-words'>{t.callSign}</div>
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
                  {t.status !== "DEPLOYED" && (
                    <IconAction label='Remove' destructive onClick={() => removeTruck(t.id)}>
                      <Trash2 />
                    </IconAction>
                  )}
                </div>
              )}
            </div>
            <div className='mt-2'>
              <TruckStatusControl truck={t} editable={editable} className='h-8 w-full' />
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
                <TableCell className='max-w-48 truncate font-data text-base font-semibold' title={t.callSign}>
                  {t.callSign}
                </TableCell>
                <TableCell>{TRUCK_TYPES[t.type]}</TableCell>
                <TableCell className='font-data text-base'>{t.plateNumber ?? "—"}</TableCell>
                <TableCell className='text-right font-data text-base'>{t.waterCapacityLiters ?? "—"}</TableCell>
                <TableCell>{OWNERSHIP[t.ownership]}</TableCell>
                <TableCell>
                  <TruckStatusControl truck={t} editable={editable} className='h-8 w-40' />
                </TableCell>
                {editable && (
                  <TableCell className='text-right whitespace-nowrap'>
                    <IconAction label='Edit' onClick={() => onEditTruck(t)}>
                      <Pencil />
                    </IconAction>
                    {t.status !== "DEPLOYED" && (
                      <IconAction label='Remove' destructive onClick={() => removeTruck(t.id)}>
                        <Trash2 />
                      </IconAction>
                    )}
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
