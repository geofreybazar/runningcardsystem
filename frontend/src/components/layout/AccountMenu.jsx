import { NavLink } from "react-router-dom";
import { ChevronDown, KeyRound, LogOut, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayName, initials } from "@/utils/person.js";
import { ROLE_LABELS } from "@/constants/roles.js";
import useAuth from "@/hooks/auth/useAuth.js";
import { officeName } from "@/utils/permissions.js";
import useTheme from "@/hooks/useTheme.js";

/** Who is signed in, plus change password, light/night mode and sign out. */
function AccountMenu() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className='flex items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none hover:bg-shell-raised focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-shell-raised'
        aria-label={`Account: ${displayName(user)}, account no. ${user.accountNumber}`}
      >
        <span className='flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground'>
          {initials(user)}
        </span>
        <span className='hidden max-w-44 leading-tight lg:grid'>
          <span className='truncate text-xs font-medium'>{displayName(user)}</span>
          <span className='truncate text-[11px] text-shell-muted'>{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className='hidden size-3.5 text-shell-muted sm:block' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel className='font-normal'>
          <div className='text-sm font-medium'>{displayName(user)}</div>
          <div className='text-xs text-muted-foreground'>
            {ROLE_LABELS[user.role]}, {officeName(user)}
          </div>
          <div className='font-data text-sm text-muted-foreground'>Account no. {user.accountNumber}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NavLink to='/change-password'>
            <KeyRound /> Change password
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => (e.preventDefault(), toggleTheme())}>
          {theme === "dark" ? <Sun /> : <Moon />} {theme === "dark" ? "Light mode" : "Night mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountMenu;
