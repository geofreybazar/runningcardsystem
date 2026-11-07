import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, stream } from "@/api/client.js";

const Ctx = createContext({ unread: 0, openIncidents: 0, last: null, version: 0, markSeen: () => {}, viewIncident: () => () => {}, refreshOpen: () => {} });
export const useNotifications = () => useContext(Ctx);

/** Two short tones; no audio file to ship. Browsers may block it until the user has interacted with the page. */
function beep() {
  try {
    const ctx = new AudioContext();
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.2);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // no sound available
  }
}

export function NotificationsProvider({ children }) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [openIncidents, setOpenIncidents] = useState(0); // open incidents in my area, for the sidebar bubble
  const [last, setLast] = useState(null); // latest live notification, so open pages can reload
  const [announcement, setAnnouncement] = useState("");
  const viewing = useRef(null); // id of the incident on screen: its notifications count as read

  const refreshOpen = useCallback(() => api("/incidents?status=OPEN").then((l) => setOpenIncidents(l.length), () => {}), []);
  const refreshUnread = useCallback(() => api("/notifications/unread-count").then((r) => setUnread(r.count), () => {}), []);

  /** Brief: what happened and where; the details are on the incident page. */
  const alert = useCallback(
    (n) => {
      const closed = n.type === "INCIDENT_CLOSED";
      const message = closed ? `Closed: ${n.incident.locationLabel}` : `${n.alarmLevel}: ${n.incident.locationLabel}`;
      const count = n.units.length;
      const description = count ? `${count} of your truck${count > 1 ? "s" : ""} ${closed ? "released" : "sent"}` : undefined;
      const options = { description, action: { label: "View", onClick: () => navigate(`/incidents/${n.incidentId}`) } };
      // Our trucks sent out: sound and a longer red toast. Everything else: a normal toast.
      if (count && !closed) {
        beep();
        toast.error(message, { ...options, duration: 30_000 });
        setAnnouncement(`${message}. ${description}`); // sonner only announces politely; dispatches interrupt
      } else {
        toast.info(message, options);
      }
    },
    [navigate],
  );

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      while (!abort.signal.aborted) {
        try {
          // Catch up on anything missed while disconnected, then listen.
          await Promise.all([refreshUnread(), refreshOpen()]);
          await stream(
            "/notifications/stream",
            (type, n) => {
              if (type !== "notification") return;
              setLast(n);
              refreshOpen();
              if (viewing.current === n.incidentId) {
                api("/notifications/seen", { method: "POST", body: { incidentId: n.incidentId } }).catch(() => {});
              } else {
                setUnread((c) => c + 1);
                alert(n);
              }
            },
            abort.signal,
          );
        } catch {
          if (abort.signal.aborted) return;
          await new Promise((r) => setTimeout(r, 5000)); // server or network down: retry
        }
      }
    })();
    return () => abort.abort();
  }, [alert, refreshOpen, refreshUnread]);

  const markSeen = useCallback(() => {
    setUnread(0);
    return api("/notifications/seen", { method: "POST" }).catch(() => {});
  }, []);

  /** Called by the incident page while it is on screen; returns the cleanup. */
  const viewIncident = useCallback(
    (incidentId) => {
      viewing.current = incidentId;
      api("/notifications/seen", { method: "POST", body: { incidentId } }).then(refreshUnread, () => {});
      return () => {
        if (viewing.current === incidentId) viewing.current = null;
      };
    },
    [refreshUnread],
  );

  return (
    <Ctx.Provider value={{ unread, openIncidents, last, version: last?.id ?? 0, markSeen, viewIncident, refreshOpen }}>
      {children}
      <div className='sr-only' role='alert' aria-live='assertive'>
        {announcement}
      </div>
    </Ctx.Provider>
  );
}

export function NotificationBell() {
  const { unread } = useNotifications();
  const label = unread ? `Notifications, ${unread} unread` : "Notifications";
  return (
    <Button asChild variant='ghost' size='icon' className='relative' aria-label={label}>
      <Link to='/notifications'>
        <Bell />
        {unread > 0 && (
          <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground'>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
