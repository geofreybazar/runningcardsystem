import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellOff, ChevronRight, CircleCheck, Siren, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Page from "@/components/Page.jsx";
import { useNotifications } from "@/components/Notifications.jsx";
import { AlarmBadge, useAlarmIndex } from "@/components/Alarm.jsx";
import { NOTIFICATION_TITLES } from "@/lib/notifications.js";
import { api } from "@/api/client.js";
import { displayName } from "@/lib/person.js";

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const ICONS = { DISPATCHED: Siren, ALARM_RAISED: TrendingUp, INCIDENT_CLOSED: CircleCheck };

function Section({ title, children }) {
  return (
    <section className='grid content-start gap-2'>
      <h2 className='text-sm font-semibold text-muted-foreground'>{title}</h2>
      {children}
    </section>
  );
}

const Empty = ({ children }) => (
  <Card className='items-center gap-2 py-8 text-center text-sm text-muted-foreground'>
    <BellOff className='size-5' />
    {children}
  </Card>
);

/** Open incidents our office is involved in (fire in our area, or our trucks responding), and the notification feed. */
function NotificationsPage() {
  const { version, markSeen } = useNotifications();
  const alarmIndex = useAlarmIndex();
  const [incidents, setIncidents] = useState(null);
  const [notes, setNotes] = useState(null);

  useEffect(() => {
    Promise.all([api("/incidents?status=OPEN"), api("/notifications")])
      .then(([i, n]) => {
        setIncidents(i);
        setNotes(n);
        markSeen(); // opening the page reads them; the unread dots stay until the next visit
      })
      .catch((e) => toast.error(e.message));
  }, [version, markSeen]);

  return (
    <Page title='Notifications' description='Incidents your area is involved in (fire, trucks sent, or on the running card), and every dispatch, alarm and close.'>
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]'>
        <Section title='Open incidents involving us'>
          {incidents?.length === 0 && <Empty>No open incidents involve your area.</Empty>}
          {incidents?.map((i) => (
            <Link key={i.id} to={`/incidents/${i.id}`}>
              <Card className='gap-1 border-l-4 border-l-primary px-4 py-3 transition-colors hover:bg-accent'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='truncate font-medium'>{i.locationLabel}</span>
                  <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <AlarmBadge level={i.alarmLevel} index={i.alarmIndex} />
                  <span className='text-sm'>{i.city?.name}</span>
                  <span className='ml-auto font-condensed text-sm tabular-nums text-muted-foreground'>{i._count.units} units</span>
                </div>
                <div className='text-xs text-muted-foreground'>Dispatched {fmt(i.createdAt)}</div>
              </Card>
            </Link>
          ))}
        </Section>

        <Section title='Notifications'>
          {notes?.length === 0 && <Empty>No notifications yet.</Empty>}
          {notes?.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <Card key={n.id} className={`gap-1 px-4 py-3 ${n.unread ? "border-primary/40 bg-accent/60" : ""}`}>
                <div className='flex items-start gap-3'>
                  <Icon className={`mt-0.5 size-4 shrink-0 ${n.type === "INCIDENT_CLOSED" ? "text-success" : "text-primary"}`} />
                  <div className='grid min-w-0 flex-1 gap-0.5'>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                      <span className='font-medium'>{NOTIFICATION_TITLES[n.type]}</span>
                      <AlarmBadge level={n.alarmLevel} index={alarmIndex(n.alarmLevel)} closed={n.type === "INCIDENT_CLOSED"} />
                      {n.unread && <span className='size-2 rounded-full bg-gold' aria-label='Unread' />}
                    </div>
                    <span className='truncate text-sm'>
                      {n.incident.locationLabel}, {n.incident.city?.name}
                    </span>
                    {n.units.length > 0 && (
                      <ul className='flex flex-wrap gap-1.5' aria-label={n.type === "INCIDENT_CLOSED" ? "Our trucks released" : "Our trucks sent"}>
                        {n.units.map((u) => (
                          <li
                            key={u.callSign}
                            title={[u.station, u.city].filter(Boolean).join(", ")}
                            className='max-w-full truncate rounded-md border border-primary/30 bg-card px-1.5 font-condensed text-sm font-semibold'
                          >
                            {u.callSign}
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className='text-xs text-muted-foreground'>
                      {fmt(n.createdAt)}, by {displayName(n.actor)}
                    </span>
                  </div>
                  <Link to={`/incidents/${n.incidentId}`} className='shrink-0 text-sm font-medium text-primary hover:underline'>
                    View
                  </Link>
                </div>
              </Card>
            );
          })}
        </Section>
      </div>
    </Page>
  );
}

export default NotificationsPage;
