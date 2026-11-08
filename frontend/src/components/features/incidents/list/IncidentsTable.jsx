import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import IncidentAlarmBadge from "@/components/features/incidents/IncidentAlarmBadge.jsx";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";

/** Wider screens: incidents as table rows; closed ones add the closing time. */
function IncidentsTable({ incidents, status, onOpen }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dispatched</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Alarm</TableHead>
          <TableHead className='text-right'>Units</TableHead>
          <TableHead>By</TableHead>
          {status === "CLOSED" && <TableHead>Closed</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents?.map((i) => (
          <TableRow key={i.id} className='cursor-pointer' onClick={() => onOpen(i)}>
            <TableCell className='whitespace-nowrap text-muted-foreground'>{formatDateTime(i.createdAt)}</TableCell>
            <TableCell className='max-w-80 truncate font-medium'>{i.locationLabel}</TableCell>
            <TableCell>{i.city?.name ?? "—"}</TableCell>
            <TableCell>
              <IncidentAlarmBadge incident={i} />
            </TableCell>
            <TableCell className='text-right tabular-nums'>{i._count.units}</TableCell>
            <TableCell>{displayName(i.createdBy)}</TableCell>
            {status === "CLOSED" && <TableCell className='whitespace-nowrap text-muted-foreground'>{formatDateTime(i.closedAt)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default IncidentsTable;
