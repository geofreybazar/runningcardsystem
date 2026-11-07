import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, ChartColumn, ChevronsUpDown, Flame, KeyRound, LogOut, Moon, ScrollText, Settings, Siren, Sun, Truck, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { displayName } from "@/lib/person.js";
import { ROLE_LABELS, useAuth } from "@/auth/AuthContext.jsx";
import { NotificationBell, NotificationsProvider, useNotifications } from "@/components/Notifications.jsx";
import { officeName } from "@/auth/permissions.js";
import { useTheme } from "@/components/Alarm.jsx";

const ALL = ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "RADIO_OPERATOR"];

/** Pages, their sidebar group, and the roles that see them. The backend enforces the same rules. */
export const NAV = [
  // The running card is the dispatcher's tool.
  { to: "/", label: "Running Card", icon: Flame, group: "Dispatch", roles: ["SUPER_ADMIN", "RADIO_OPERATOR"] },
  { to: "/incidents", label: "Incidents", icon: Siren, group: "Dispatch", roles: ALL },
  { to: "/notifications", label: "Notifications", icon: Bell, group: "Dispatch", roles: ALL },
  { to: "/statistics", label: "Statistics", icon: ChartColumn, group: "Dispatch", roles: ALL },
  { to: "/stations", label: "Stations & Trucks", icon: Truck, group: "Resources", roles: ALL },
  { to: "/users", label: "Users", icon: Users, group: "Administration", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/audit-log", label: "Audit log", icon: ScrollText, group: "Administration", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/settings", label: "Settings", icon: Settings, group: "Administration", roles: ["SUPER_ADMIN"] },
];

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Full logo when the sidebar is open; the NCR badge when it is collapsed to icons. */
function Brand() {
  return (
    <div className='px-1 py-1.5'>
      <div className='grid gap-1 group-data-[collapsible=icon]:hidden'>
        <img src='/logo.webp' alt='Bureau of Fire Protection NCR' width={375} height={110} className='h-auto w-full' />
        <span className='text-center text-xs font-medium text-muted-foreground'>Running Card System</span>
      </div>
      <img src='/logo-badge.webp' alt='BFP-NCR' width={32} height={32} className='hidden size-8 group-data-[collapsible=icon]:block' />
    </div>
  );
}

function NavItems({ items }) {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { openIncidents } = useNotifications();
  const badges = { "/incidents": openIncidents };
  return items.map((n) => {
    const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
    return (
      <SidebarMenuItem key={n.to}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={n.label}
          className='data-[active=true]:font-semibold data-[active=true]:shadow-[inset_3px_0_0_var(--gold)]'
        >
          <NavLink to={n.to} onClick={() => isMobile && setOpenMobile(false)}>
            <n.icon />
            <span>{n.label}</span>
          </NavLink>
        </SidebarMenuButton>
        {badges[n.to] > 0 && (
          <SidebarMenuBadge className='rounded-full bg-primary text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground' aria-label={`${badges[n.to]} open`}>
            {badges[n.to]}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  });
}

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

function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const groups = [...new Set(items.map((n) => n.group))];
  const current = [...items].reverse().find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <NotificationsProvider>
      <SidebarProvider>
        <Sidebar collapsible='icon'>
          <SidebarHeader>
            <Brand />
          </SidebarHeader>
          <SidebarContent>
            {groups.map((g) => (
              <SidebarGroup key={g}>
                <SidebarGroupLabel>{g}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <NavItems items={items.filter((n) => n.group === g)} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <UserMenu />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className='sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-1 data-[orientation=vertical]:h-4' />
            <span className='text-sm font-medium'>{current?.label ?? ""}</span>
            <div className='ml-auto'>
              <NotificationBell />
            </div>
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </NotificationsProvider>
  );
}

export default Layout;
