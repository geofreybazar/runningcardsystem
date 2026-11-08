import { alarmTone } from "@/utils/alarm.js";
import { cn } from "@/lib/utils";

/** Alarm level pill on the shared escalation scale; closed incidents are muted. */
function AlarmBadge({ level, index, closed, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 font-condensed text-sm leading-tight font-semibold whitespace-nowrap",
        closed ? "bg-secondary text-secondary-foreground" : alarmTone(index),
        className,
      )}
    >
      {level}
    </span>
  );
}

export default AlarmBadge;
