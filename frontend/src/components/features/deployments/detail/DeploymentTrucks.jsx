import Panel from "@/components/common/Panel.jsx";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TRUCK_TYPES } from "@/constants/truck.js";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";

/** Every truck sent to the event, by station, with its post; managers set posts and release trucks still there. */
function DeploymentTrucks({ units, canRelease, onRelease, onSetPost, busy }) {
  if (units.length === 0) {
    return (
      <Panel title='Trucks'>
        <p className='py-6 text-center text-sm text-muted-foreground'>No trucks assigned yet.</p>
      </Panel>
    );
  }
  return (
    <Panel title='Trucks' meta={`${units.filter((u) => !u.releasedAt).length} of ${units.length} still there`} flush>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Truck</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Released</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((u) => (
              <TableRow key={u.id}>
                <TableCell className='font-data text-base font-semibold'>
                  {u.truck.callSign}
                  <div className='font-sans text-xs font-normal text-muted-foreground'>{TRUCK_TYPES[u.truck.type]}</div>
                </TableCell>
                <TableCell>
                  <span className='flex items-center gap-2'>
                    <span className='size-2.5 shrink-0 rounded-[2px]' style={{ background: u.station.district.color }} />
                    <span>
                      {u.station.name}
                      {u.station.city && <span className='block text-xs text-muted-foreground'>{u.station.city.name}</span>}
                    </span>
                  </span>
                </TableCell>
                <TableCell className='text-sm'>
                  <span className={u.postLabel ? "" : "text-muted-foreground"}>{u.postLabel ?? "Event location"}</span>
                  {canRelease && !u.releasedAt && (
                    <Button size='sm' variant='link' className='block h-auto px-0' onClick={() => onSetPost(u)} disabled={busy}>
                      {u.postLabel ? "Change post" : "Set post"}
                    </Button>
                  )}
                </TableCell>
                <TableCell className='text-sm whitespace-nowrap'>
                  {formatDateTime(u.assignedAt)}
                  <div className='text-xs text-muted-foreground'>{displayName(u.assignedBy)}</div>
                </TableCell>
                <TableCell className='text-sm whitespace-nowrap'>
                  {u.releasedAt ? (
                    <>
                      {formatDateTime(u.releasedAt)}
                      <div className='text-xs text-muted-foreground'>{displayName(u.releasedBy)}</div>
                    </>
                  ) : canRelease ? (
                    <Button size='sm' variant='outline' onClick={() => onRelease(u)} disabled={busy}>
                      Release
                    </Button>
                  ) : (
                    <StatusBadge tone='info'>On deployment</StatusBadge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

export default DeploymentTrucks;
