import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import NotificationBell from "@/components/layout/NotificationBell.jsx";

/** Top bar: sidebar toggle, the current page's name, and the notification bell. */
function Navbar({ title }) {
  return (
    <header className='sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur'>
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' className='mr-1 data-[orientation=vertical]:h-4' />
      <span className='text-sm font-medium'>{title}</span>
      <div className='ml-auto'>
        <NotificationBell />
      </div>
    </header>
  );
}

export default Navbar;
