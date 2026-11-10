import { cn } from "@/lib/utils";
import useNotifications from "@/hooks/notifications/useNotifications.js";

const STATES = {
  live: { label: "Live", dot: "bg-success", hint: "Receiving dispatches as they happen" },
  connecting: { label: "Connecting", dot: "bg-warning animate-pulse", hint: "Connecting to live updates" },
  offline: { label: "Offline", dot: "bg-danger animate-pulse", hint: "Live updates lost; retrying. Reload pages to see changes." },
};

/** Whether live dispatch notifications are flowing: a dispatcher must know when the screen may be stale. */
function LiveStatus() {
  const { linkStatus } = useNotifications();
  const s = STATES[linkStatus] ?? STATES.connecting;
  return (
    <span role='status' title={s.hint} className='flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-xs text-shell-muted'>
      <span className={cn("size-2 rounded-full", s.dot)} aria-hidden='true' />
      <span className='sr-only sm:not-sr-only'>{s.label}</span>
      <span className='sr-only'>: {s.hint}</span>
    </span>
  );
}

export default LiveStatus;
