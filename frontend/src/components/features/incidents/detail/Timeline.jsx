import { CircleCheck, Siren, TrendingUp, UserPlus } from "lucide-react";
import { Card as Panel } from "@/components/ui/card";
import { alarmTone } from "@/utils/alarm.js";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";
import { cn } from "@/lib/utils";

const STEP = {
  DISPATCHED: { icon: Siren, label: (s) => `${s.alarmLevel} dispatched`, verb: "sent" },
  ALARM_RAISED: { icon: TrendingUp, label: (s) => `Raised to ${s.alarmLevel}`, verb: "sent" },
  INCIDENT_CLOSED: { icon: CircleCheck, label: () => "Incident closed", verb: "released" },
  UNIT_REQUESTED: { icon: UserPlus, label: (s) => `Special unit requested (${s.alarmLevel})`, verb: "sent" },
};

/** Time log: when each alarm was dispatched or raised, and the close, with who did it. */
function Timeline({ steps }) {
  if (!steps?.length) return null;
  return (
    <Panel className='gap-3 px-4 py-4'>
      <h2 className='text-sm font-semibold'>Time log</h2>
      <ol className='relative grid gap-4 border-l pl-5'>
        {steps.map((s, i) => {
          const { icon: Icon, label, verb } = STEP[s.type];
          // Each dispatch/raise is one level up the scale; the close and special-unit requests are shown neutral.
          const closed = s.type === "INCIDENT_CLOSED";
          const neutral = closed || s.type === "UNIT_REQUESTED";
          const index = steps.slice(0, i).filter((p) => p.type === "DISPATCHED" || p.type === "ALARM_RAISED").length;
          return (
            <li key={i} className='relative'>
              <span
                className={cn(
                  "absolute top-0.5 -left-[1.95rem] flex size-5 items-center justify-center rounded-full",
                  closed ? "border bg-card text-success" : neutral ? "border bg-card text-primary" : alarmTone(index),
                )}
              >
                <Icon className='size-3' />
              </span>
              <div className='flex flex-wrap items-baseline gap-x-3'>
                <span className='text-sm font-medium'>{label(s)}</span>
                <time className='text-sm tabular-nums text-muted-foreground' dateTime={s.at}>
                  {formatDateTime(s.at)}
                </time>
              </div>
              <p className='text-xs text-muted-foreground'>
                {s.trucks} truck{s.trucks === 1 ? "" : "s"} {verb}
                {s.by && `, by ${displayName(s.by)}`}
              </p>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export default Timeline;
