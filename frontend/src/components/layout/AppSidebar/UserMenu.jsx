import { NavLink } from "react-router-dom";
import { ChevronsUpDown, KeyRound, LogOut, Moon, Sun } from "lucide-react";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayName } from "@/utils/person.js";
import { ROLE_LABELS } from "@/constants/roles.js";
import useAuth from "@/hooks/auth/useAuth.js";
import { officeName } from "@/utils/permissions.js";
import useTheme from "@/hooks/useTheme.js";

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Who is signed in, plus change password, light/night mode and sign out. */
function UserMenu() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const { isMobile } = useSidebar();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size='lg' className='h-auto py-2 data-[state=open]:bg-sidebar-accent'>
          <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold'>
            {initials(`${user.firstName} ${user.lastName}`)}
          </div>
          <div className='grid flex-1 text-left leading-tight'>
            <span className='truncate text-sm font-medium'>{displayName(user)}</span>
            <span className='truncate text-xs text-muted-foreground'>{ROLE_LABELS[user.role]}</span>
            <span className='truncate text-xs text-muted-foreground'>{officeName(user)}</span>
          </div>
          <ChevronsUpDown className='ml-auto size-4' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={isMobile ? "bottom" : "right"} align='end' className='w-56'>
        <DropdownMenuLabel className='font-normal'>
          <div className='text-sm font-medium'>{displayName(user)}</div>
          <div className='text-xs text-muted-foreground'>
            {ROLE_LABELS[user.role]}, {officeName(user)}
          </div>
          <div className='text-xs text-muted-foreground'>Account no. {user.accountNumber}</div>
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
        <DropdownMenuItem onClick={logout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
