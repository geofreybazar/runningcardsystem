import StatusBadge from "@/components/common/StatusBadge.jsx";
import { Switch } from "@/components/ui/switch";
import { ROLE_LABELS } from "@/constants/roles.js";
import { officeName } from "@/utils/permissions.js";
import { displayName } from "@/utils/person.js";
import Actions from "./Actions.jsx";

/** Phones: one card per user. */
function MobileView({ users, editable, onEdit, onReset, onRemove, onSetActive }) {
  return (
    <div className='divide-y md:hidden'>
      {users.map((u) => (
        <div key={u.id} className='grid gap-2 px-3 py-2.5'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <div className='truncate font-medium'>{displayName(u)}</div>
              <div className='text-xs text-muted-foreground'>
                {ROLE_LABELS[u.role]}, {officeName(u)}
              </div>
              <div className='font-data text-sm text-muted-foreground'>{u.accountNumber}</div>
            </div>
            <Switch checked={u.isActive} disabled={!editable(u)} onCheckedChange={(v) => onSetActive(u, v)} aria-label='Active' />
          </div>
          {u.mustChangePassword && (
            <StatusBadge tone='warning' className='w-fit'>
              Temporary password
            </StatusBadge>
          )}
          {editable(u) && <Actions onEdit={() => onEdit(u)} onReset={() => onReset(u)} onRemove={() => onRemove(u)} />}
        </div>
      ))}
    </div>
  );
}

export default MobileView;
