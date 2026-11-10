import { Card as Panel } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import { Badge } from "@/components/ui/badge";
import { TRUCK_TYPES } from "@/constants/truck.js";
import { formatTime } from "@/utils/dateTime.js";

/** Every truck sent, grouped by the alarm level it went out on. */
function UnitsTable({ incident }) {
  const open = incident.status === "OPEN";
  const levels = [...new Set(incident.units.map((u) => u.alarmLevel))];
  return (
    <Panel className='py-0'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alarm</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Released</TableHead>
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
                    <TableCell className='font-condensed text-base font-semibold'>
                      {u.truck.callSign}
                      <div className='font-sans text-xs font-normal text-muted-foreground'>
                        {TRUCK_TYPES[u.truck.type]}
                        {u.special && <Badge variant='outline' className='ml-1.5 h-4 px-1 text-[10px]'>Requested</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className='tabular-nums'>{formatTime(u.dispatchedAt)}</TableCell>
                    <TableCell className='tabular-nums text-muted-foreground'>{u.releasedAt ? formatTime(u.releasedAt) : "—"}</TableCell>
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
