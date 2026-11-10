import { displayName, initials } from "@/utils/person.js";
import { ROLE_LABELS } from "@/constants/roles.js";
import { officeName } from "@/utils/permissions.js";
import useAuth from "@/hooks/auth/useAuth.js";

/** Who is on this console and for which office; the account menu itself is in the top bar. */
function SidebarProfile() {
  const { user } = useAuth();
  return (
    <div className='flex items-center gap-2 rounded-md border border-shell-border px-2 py-2 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0'>
      <span className='flex size-8 shrink-0 items-center justify-center rounded-sm bg-shell-raised text-xs font-semibold' title={displayName(user)}>
        {initials(user)}
      </span>
      <div className='grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden'>
        <span className='truncate text-xs font-medium'>{displayName(user)}</span>
        <span className='truncate text-[11px] text-shell-muted'>{ROLE_LABELS[user.role]}</span>
        <span className='truncate text-[11px] text-shell-muted'>{officeName(user)}</span>
      </div>
    </div>
  );
}

export default SidebarProfile;
