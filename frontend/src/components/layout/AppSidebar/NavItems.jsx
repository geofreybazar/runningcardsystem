import { NavLink, useLocation } from "react-router-dom";
import { SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import useNotifications from "@/hooks/notifications/useNotifications.js";

/** Sidebar links; Incidents shows a bubble with the open incidents in my area. */
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
          className='text-shell-foreground/85 hover:bg-shell-raised hover:text-shell-foreground data-[active=true]:bg-shell-raised data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_var(--primary)]'
        >
          <NavLink to={n.to} onClick={() => isMobile && setOpenMobile(false)}>
            <n.icon />
            <span>{n.label}</span>
          </NavLink>
        </SidebarMenuButton>
        {badges[n.to] > 0 && (
          <SidebarMenuBadge
            className='rounded-full bg-primary text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground'
            aria-label={`${badges[n.to]} open`}
          >
            {badges[n.to]}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  });
}

export default NavItems;
