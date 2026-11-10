import { Link } from "react-router-dom";
import { CircleCheck, Siren, TrendingUp, Undo2, UserPlus } from "lucide-react";
import FireTruckIcon from "@/components/common/FireTruckIcon.jsx";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import { NOTIFICATION_PRIORITY as PRIORITY, NOTIFICATION_TITLES } from "@/constants/notifications.js";
import { displayName } from "@/utils/person.js";
import { formatTime } from "@/utils/dateTime.js";
import { notificationLink, notificationPlace } from "@/utils/notification.js";
import { cn } from "@/lib/utils";

const ICONS = {
  DISPATCHED: Siren,
  ALARM_RAISED: TrendingUp,
  UNIT_REQUESTED: UserPlus,
  INCIDENT_CLOSED: CircleCheck,
  DEPLOYMENT_ASSIGNED: FireTruckIcon,
  DEPLOYMENT_RELEASED: Undo2,
};
const STRIPE = { high: "border-l-danger", info: "border-l-info", routine: "border-l-border" };
const ICON_TONE = { high: "text-danger-foreground", info: "text-info-foreground", routine: "text-success-foreground" };
const RELEASED = new Set(["INCIDENT_CLOSED", "DEPLOYMENT_RELEASED"]);

/** One notification row: what happened and where, our trucks involved, when and by whom. */
function NotificationItem({ n, alarmIndex }) {
  const Icon = ICONS[n.type];
  const priority = PRIORITY[n.type];
  return (
    <li className={cn("flex items-start gap-3 border-l-[3px] px-3 py-2.5", STRIPE[priority], n.unread && "bg-accent/70")}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", ICON_TONE[priority])} />
      <div className='grid min-w-0 flex-1 gap-1'>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <span className='text-sm font-semibold'>{NOTIFICATION_TITLES[n.type]}</span>
          {n.alarmLevel && <AlarmBadge level={n.alarmLevel} index={alarmIndex(n.alarmLevel)} closed={n.type === "INCIDENT_CLOSED"} />}
          {n.unread && (
            <span className='rounded-sm bg-gold px-1 text-[11px] font-semibold text-gold-foreground' aria-label='Unread'>
              NEW
            </span>
          )}
          <time className='ml-auto font-data text-sm text-muted-foreground' dateTime={n.createdAt}>
            {formatTime(n.createdAt)}
          </time>
        </div>
        <span className='truncate text-sm'>{notificationPlace(n)}</span>
        {n.units.length > 0 && (
          <ul className='flex flex-wrap gap-1' aria-label={RELEASED.has(n.type) ? "Our trucks released" : "Our trucks sent"}>
            {n.units.map((u) => (
              <li key={u.callSign} title={[u.station, u.city].filter(Boolean).join(", ")} className='max-w-full truncate rounded-sm border bg-card px-1.5 font-data text-sm'>
                {u.callSign}
              </li>
            ))}
          </ul>
        )}
        <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
          <span className='truncate'>by {displayName(n.actor)}</span>
          <Link to={notificationLink(n)} className='shrink-0 font-medium text-foreground underline-offset-4 hover:underline'>
            View
          </Link>
        </div>
      </div>
    </li>
  );
}

export default NotificationItem;
