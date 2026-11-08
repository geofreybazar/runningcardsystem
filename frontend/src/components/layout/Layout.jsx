import { Outlet, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import NotificationsProvider from "@/components/app/providers/NotificationsProvider.jsx";
import AppSidebar from "./AppSidebar/AppSidebar.jsx";
import Navbar from "./Navbar.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import { NAV } from "@/constants/links.js";

/** Signed-in shell: sidebar, top bar and the current page. Live notifications run while it is mounted. */
function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const current = [...items].reverse().find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <NotificationsProvider>
      <SidebarProvider>
        <AppSidebar items={items} />
        <SidebarInset>
          <Navbar title={current?.label ?? ""} />
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </NotificationsProvider>
  );
}

export default Layout;
