import { Link } from "react-router-dom";
import { CircleCheck, Siren, TrendingUp, Undo2, UserPlus } from "lucide-react";
import FireTruckIcon from "@/components/common/FireTruckIcon.jsx";
import { Card } from "@/components/ui/card";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import { NOTIFICATION_TITLES } from "@/constants/notifications.js";
import { displayName } from "@/utils/person.js";
import { formatDateTime } from "@/utils/dateTime.js";
import { notificationLink, notificationPlace } from "@/utils/notification.js";

const ICONS = { DISPATCHED: Siren, ALARM_RAISED: TrendingUp, INCIDENT_CLOSED: CircleCheck, UNIT_REQUESTED: UserPlus, DEPLOYMENT_ASSIGNED: FireTruckIcon, DEPLOYMENT_RELEASED: Undo2 };
const RELEASED = new Set(["INCIDENT_CLOSED", "DEPLOYMENT_RELEASED"]);

/** One notification: what happened, where, our trucks involved, who did it. */
function NotificationItem({ n, alarmIndex }) {
  const Icon = ICONS[n.type];
  return (
    <Card className={`gap-1 px-4 py-3 ${n.unread ? "border-primary/40 bg-accent/60" : ""}`}>
      <div className='flex items-start gap-3'>
        <Icon className={`mt-0.5 size-4 shrink-0 ${RELEASED.has(n.type) ? "text-success" : "text-primary"}`} />
        <div className='grid min-w-0 flex-1 gap-0.5'>
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            <span className='font-medium'>{NOTIFICATION_TITLES[n.type]}</span>
            {n.alarmLevel && <AlarmBadge level={n.alarmLevel} index={alarmIndex(n.alarmLevel)} closed={n.type === "INCIDENT_CLOSED"} />}
            {n.unread && <span className='size-2 rounded-full bg-gold' aria-label='Unread' />}
          </div>
          <span className='truncate text-sm'>
            {notificationPlace(n)}
          </span>
          {n.units.length > 0 && (
            <ul className='flex flex-wrap gap-1.5' aria-label={RELEASED.has(n.type) ? "Our trucks released" : "Our trucks sent"}>
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
            {formatDateTime(n.createdAt)}, by {displayName(n.actor)}
          </span>
        </div>
        <Link to={notificationLink(n)} className='shrink-0 text-sm font-medium text-primary hover:underline'>
          View
        </Link>
      </div>
    </Card>
  );
}

export default NotificationItem;
