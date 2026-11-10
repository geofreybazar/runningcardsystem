import StatusBadge from "@/components/common/StatusBadge.jsx";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS } from "@/constants/roles.js";
import { officeName } from "@/utils/permissions.js";
import { displayName } from "@/utils/person.js";
import Actions from "./Actions.jsx";

/** Wider screens: a table. */
function DesktopView({ users, editable, onEdit, onReset, onRemove, onSetActive }) {
  return (
    <div className='hidden md:block'>
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
              <TableCell className={u.isActive ? "font-medium" : "font-medium text-muted-foreground line-through decoration-muted-foreground/50"}>{displayName(u)}</TableCell>
              <TableCell>
                <span className='font-data text-base'>{u.accountNumber}</span>
                {u.mustChangePassword && (
                  <StatusBadge tone='warning' className='ml-2'>
                    Temporary password
                  </StatusBadge>
                )}
              </TableCell>
              <TableCell>{ROLE_LABELS[u.role]}</TableCell>
              <TableCell className='text-muted-foreground'>{officeName(u)}</TableCell>
              <TableCell>
                <Switch checked={u.isActive} disabled={!editable(u)} onCheckedChange={(v) => onSetActive(u, v)} aria-label='Active' />
              </TableCell>
              <TableCell>{editable(u) && <Actions onEdit={() => onEdit(u)} onReset={() => onReset(u)} onRemove={() => onRemove(u)} />}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DesktopView;
