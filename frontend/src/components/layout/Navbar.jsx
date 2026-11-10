import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationBell from "@/components/layout/NotificationBell.jsx";
import LiveStatus from "@/components/layout/LiveStatus.jsx";
import ShiftClock from "@/components/layout/ShiftClock.jsx";
import AccountMenu from "@/components/layout/AccountMenu.jsx";

/**
 * Charcoal top bar: sidebar toggle, breadcrumb and the page title (the page's only h1), then the live link, the
 * Manila clock, notifications and the account menu.
 */
function Navbar({ section, detail }) {
  const parent = detail?.parent;
  const title = detail ? detail.title : (section?.label ?? "");
  return (
    <header className='sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-shell-border bg-shell px-2 text-shell-foreground sm:px-3'>
      <SidebarTrigger className='text-shell-muted hover:bg-shell-raised hover:text-shell-foreground' />
      <div className='h-5 w-px bg-shell-border' aria-hidden='true' />
      <nav aria-label='Breadcrumb' className='flex min-w-0 flex-1 items-center gap-1.5 pl-1'>
        {parent && (
          <>
            <Link to={parent.to} aria-label={parent.aria} className='shrink-0 text-sm text-shell-muted hover:text-shell-foreground hover:underline'>
              {parent.label}
            </Link>
            <ChevronRight className='size-3.5 shrink-0 text-shell-muted' aria-hidden='true' />
          </>
        )}
        <h1 className='truncate text-sm font-semibold tracking-tight'>{title}</h1>
      </nav>
      <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
        <LiveStatus />
        <ShiftClock />
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  );
}

export default Navbar;
