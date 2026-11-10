import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import { displayName } from "@/utils/person.js";
import { ACTION_LABELS, AUDIT_ENTITIES, WARNING_ACTIONS } from "@/constants/audit.js";
import { auditDetails } from "@/utils/audit.js";
import { formatTime, groupByDay } from "@/utils/dateTime.js";

/** Audit entries by day, newest first: time, who, action (warnings in the danger tone), what, and a readable detail line. */
function AuditTable({ rows }) {
  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader className='sticky top-0 z-10'>
          <TableRow className='hover:bg-transparent'>
            <TableHead>Time</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>What</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupByDay(rows).map(([day, entries]) => (
            <Fragment key={day}>
              <TableRow className='bg-muted/50 hover:bg-muted/50'>
                <TableCell colSpan={5} className='py-1 text-label text-muted-foreground'>
                  {day} · {entries.length}
                </TableCell>
              </TableRow>
              {entries.map((r) => (
                <TableRow key={r.id} className='align-top'>
                  <TableCell className='font-data text-base whitespace-nowrap'>{formatTime(r.createdAt)}</TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {r.user ? displayName(r.user) : <span className='text-muted-foreground'>Unknown account</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={WARNING_ACTIONS.has(r.action) ? "danger" : "neutral"}>{ACTION_LABELS[r.action] ?? r.action}</StatusBadge>
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {AUDIT_ENTITIES[r.entity] ?? r.entity} <span className='font-data text-muted-foreground'>#{r.entityId.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell className='max-w-md text-xs break-words whitespace-normal text-muted-foreground'>{auditDetails(r)}</TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AuditTable;
