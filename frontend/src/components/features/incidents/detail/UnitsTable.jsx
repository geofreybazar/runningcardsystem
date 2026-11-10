import Panel from "@/components/common/Panel.jsx";
import TruckStatusBadge from "@/components/common/TruckStatusBadge.jsx";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import { TRUCK_TYPES } from "@/constants/truck.js";
import { formatTime } from "@/utils/dateTime.js";

/** Every truck sent, grouped by the alarm level it went out on. */
function UnitsTable({ incident }) {
  const open = incident.status === "OPEN";
  const levels = [...new Set(incident.units.map((u) => u.alarmLevel))];
  return (
    <Panel title='Units' meta={`${incident.units.length} sent`} flush>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alarm</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.flatMap((level) =>
              incident.units
                .filter((u) => u.alarmLevel === level)
                .map((u, i) => (
                  <TableRow key={u.id}>
                    <TableCell className='whitespace-nowrap'>{i === 0 && <AlarmBadge level={level} index={levels.indexOf(level)} closed={!open} />}</TableCell>
                    <TableCell>
                      <span className='flex items-center gap-2'>
                        <span className='size-2.5 shrink-0 rounded-full' style={{ background: u.station.district.color }} />
                        <span>
                          {u.station.name}
                          {u.station.city && <span className='block text-xs text-muted-foreground'>{u.station.city.name}</span>}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className='font-data text-base font-semibold'>
                      {u.truck.callSign}
                      <div className='font-sans text-xs font-normal text-muted-foreground'>
                        {TRUCK_TYPES[u.truck.type]}
                        {u.special && (
                          <StatusBadge tone='info' className='ml-1.5 h-4 text-[11px]'>
                            Requested
                          </StatusBadge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='font-data text-base'>{formatTime(u.dispatchedAt)}</TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {/* Still on the incident: the truck's live status. Released: when. */}
                      {u.releasedAt ? <StatusBadge tone='muted'>Released {formatTime(u.releasedAt)}</StatusBadge> : <TruckStatusBadge status={u.truck.status} />}
                    </TableCell>
                  </TableRow>
                )),
            )}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

export default UnitsTable;
