import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS } from "@/constants/roles.js";
import { officeName } from "@/utils/permissions.js";
import { displayName } from "@/utils/person.js";
import Actions from "./Actions.jsx";

/** Wider screens: a table. */
function DesktopView({ users, editable, onEdit, onReset, onRemove, onSetActive }) {
  return (
    <Card className='hidden py-0 md:block'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Account no.</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Office</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className='font-medium'>{displayName(u)}</TableCell>
              <TableCell>
                <span className='font-mono text-muted-foreground'>{u.accountNumber}</span>
                {u.mustChangePassword && (
                  <Badge variant='outline' className='ml-2'>
                    Temporary password
                  </Badge>
                )}
              </TableCell>
              <TableCell>{ROLE_LABELS[u.role]}</TableCell>
              <TableCell>{officeName(u)}</TableCell>
              <TableCell>
                <Switch checked={u.isActive} disabled={!editable(u)} onCheckedChange={(v) => onSetActive(u, v)} aria-label='Active' />
              </TableCell>
              <TableCell>{editable(u) && <Actions onEdit={() => onEdit(u)} onReset={() => onReset(u)} onRemove={() => onRemove(u)} />}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default DesktopView;
