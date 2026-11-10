import { alarmTone } from "@/utils/alarm.js";
import { cn } from "@/lib/utils";

/** Alarm level pill on the shared escalation scale; closed incidents are muted. */
function AlarmBadge({ level, index, closed, className }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-sm px-1.5 font-data text-sm leading-none font-semibold whitespace-nowrap",
        closed ? "bg-secondary text-secondary-foreground" : alarmTone(index),
        className,
      )}
    >
      {level}
    </span>
  );
}

export default AlarmBadge;
