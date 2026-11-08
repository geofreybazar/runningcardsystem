import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ROLE_LABELS } from "@/constants/roles.js";
import { officeName } from "@/utils/permissions.js";
import { displayName } from "@/utils/person.js";
import Actions from "./Actions.jsx";

/** Phones: one card per user. */
function MobileView({ users, editable, onEdit, onReset, onRemove, onSetActive }) {
  return (
    <div className='grid gap-2 md:hidden'>
      {users.map((u) => (
        <Card key={u.id} className='gap-2 px-4 py-3'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <div className='truncate font-medium'>{displayName(u)}</div>
              <div className='text-xs text-muted-foreground'>
                {ROLE_LABELS[u.role]}, {officeName(u)}
              </div>
              <div className='font-condensed text-sm tabular-nums text-muted-foreground'>{u.accountNumber}</div>
            </div>
            <Switch checked={u.isActive} disabled={!editable(u)} onCheckedChange={(v) => onSetActive(u, v)} aria-label='Active' />
          </div>
          {u.mustChangePassword && (
            <Badge variant='outline' className='w-fit'>
              Temporary password
            </Badge>
          )}
          {editable(u) && <Actions onEdit={() => onEdit(u)} onReset={() => onReset(u)} onRemove={() => onRemove(u)} />}
        </Card>
      ))}
    </div>
  );
}

export default MobileView;
