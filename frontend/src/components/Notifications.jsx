import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, stream } from "@/api/client.js";
import { displayName } from "@/lib/person.js";
import { NOTIFICATION_TITLES, unitsLine } from "@/lib/notifications.js";

const Ctx = createContext({ unread: 0, version: 0, markSeen: () => {} });
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
  const [version, setVersion] = useState(0); // bumps on every live notification so open pages can reload

  const alert = useCallback(
    (n) => {
      const ours = unitsLine(n);
      const message = `${NOTIFICATION_TITLES[n.type]}: ${n.alarmLevel} · ${n.incident.locationLabel}`;
      const description = [ours, `${n.incident.city?.name ?? ""} fire · by ${displayName(n.actor)}`].filter(Boolean).join("\n");
      const options = { description, action: { label: "View", onClick: () => navigate(`/incidents/${n.incidentId}`) } };
      // Our trucks sent out: loud and long. Everything else (including releases on close): a normal toast.
      if (ours && n.type !== "INCIDENT_CLOSED") {
        beep();
        toast.error(message, { ...options, duration: 60_000, className: "whitespace-pre-line" });
      } else {
        toast.info(message, { ...options, className: "whitespace-pre-line" });
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
          setUnread((await api("/notifications/unread-count")).count);
          await stream(
            "/notifications/stream",
            (type, n) => {
              if (type !== "notification") return;
              setUnread((c) => c + 1);
              setVersion((v) => v + 1);
              alert(n);
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
  }, [alert]);

  const markSeen = useCallback(() => {
    setUnread(0);
    return api("/notifications/seen", { method: "POST" }).catch(() => {});
  }, []);

  return <Ctx.Provider value={{ unread, version, markSeen }}>{children}</Ctx.Provider>;
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
