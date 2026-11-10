import { cn } from "@/lib/utils";
import { STATUS_TONES } from "@/constants/status.js";

/** A status label with a dot in its tone (constants/status.js). `pulse` marks a live state, e.g. an open incident. */
function StatusBadge({ tone = "neutral", children, pulse = false, className }) {
  const t = STATUS_TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-sm border px-1.5 text-xs leading-none font-medium whitespace-nowrap",
        t.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-[1px]", t.dot, pulse && "animate-pulse")} aria-hidden='true' />
      {children}
    </span>
  );
}

export default StatusBadge;
