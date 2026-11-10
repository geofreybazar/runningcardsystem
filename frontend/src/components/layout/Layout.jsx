import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import NotificationsProvider from "@/components/app/providers/NotificationsProvider.jsx";
import { PageTitleContext } from "@/hooks/layout/usePageTitle.js";
import AppSidebar from "./AppSidebar/AppSidebar.jsx";
import Navbar from "./Navbar.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import { NAV } from "@/constants/links.js";

/** Signed-in shell: charcoal sidebar and top bar around the current page. Live notifications run while it is mounted. */
function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [detail, setDetail] = useState(null);
  const titleContext = useMemo(() => ({ detail, setDetail }), [detail]);
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const current = [...items].reverse().find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <NotificationsProvider>
      <PageTitleContext.Provider value={titleContext}>
        <SidebarProvider>
          <AppSidebar items={items} />
          <SidebarInset className='min-w-0'>
            <Navbar section={current} detail={detail} />
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </PageTitleContext.Provider>
    </NotificationsProvider>
  );
}

export default Layout;
