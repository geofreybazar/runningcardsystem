import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayName } from "@/utils/person.js";
import { ACTION_LABELS, AUDIT_ENTITIES, WARNING_ACTIONS } from "@/constants/audit.js";
import { auditDetails } from "@/utils/audit.js";
import { formatDateTime } from "@/utils/dateTime.js";

/** Audit entries: when, who, action (warnings stand out), what, and a readable detail line. */
function AuditTable({ rows }) {
  return (
    <Card className='py-0'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>What</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className='align-top'>
                <TableCell className='whitespace-nowrap text-muted-foreground'>{formatDateTime(r.createdAt)}</TableCell>
                <TableCell className='whitespace-nowrap'>
                  {r.user ? displayName(r.user) : <span className='text-muted-foreground'>Unknown account</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={WARNING_ACTIONS.has(r.action) ? "destructive" : "outline"}>{ACTION_LABELS[r.action] ?? r.action}</Badge>
                </TableCell>
                <TableCell className='whitespace-nowrap'>
                  {AUDIT_ENTITIES[r.entity] ?? r.entity} <span className='text-muted-foreground'>#{r.entityId.slice(0, 8)}</span>
                </TableCell>
                <TableCell className='max-w-md text-xs break-words whitespace-normal text-muted-foreground'>{auditDetails(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export default AuditTable;
