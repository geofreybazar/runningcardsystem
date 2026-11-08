import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";

/** Wider screens: deployments as table rows. "Trucks" counts the ones still there. */
function DeploymentsTable({ deployments, onOpen }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Starts</TableHead>
          <TableHead>Ends</TableHead>
          <TableHead className='text-right'>Trucks</TableHead>
          <TableHead>Created by</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deployments.map((d) => (
          <TableRow key={d.id} className='cursor-pointer' onClick={() => onOpen(d)}>
            <TableCell className='font-medium'>{d.name}</TableCell>
            <TableCell className='max-w-72 truncate'>{d.locationLabel}</TableCell>
            <TableCell className='whitespace-nowrap text-muted-foreground'>{formatDateTime(d.startsAt)}</TableCell>
            <TableCell className='whitespace-nowrap text-muted-foreground'>{d.endsAt ? formatDateTime(d.endsAt) : "—"}</TableCell>
            <TableCell className='text-right tabular-nums'>{d._count.units}</TableCell>
            <TableCell>{displayName(d.createdBy)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default DeploymentsTable;
