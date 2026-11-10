import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import useNotifications from "@/hooks/notifications/useNotifications.js";

function NotificationBell() {
  const { unread } = useNotifications();
  const label = unread ? `Notifications, ${unread} unread` : "Notifications";
  return (
    <Button asChild variant='ghost' size='icon' className='relative text-shell-muted hover:bg-shell-raised hover:text-shell-foreground' aria-label={label}>
      <Link to='/notifications'>
        <Bell />
        {unread > 0 && (
          <span className='absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-primary px-1 font-data text-[11px] leading-none font-semibold text-primary-foreground'>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}

export default NotificationBell;
