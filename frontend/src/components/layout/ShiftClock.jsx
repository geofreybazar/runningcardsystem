import { useEffect, useState } from "react";

const TIME = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const DATE = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric" });

/** Philippine time, to the second: dispatchers read times off it for the radio log. Hidden on phones. */
function ShiftClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <time dateTime={now.toISOString()} className='hidden items-baseline gap-2 border-x border-shell-border px-3 md:flex' aria-label={`Philippine time ${TIME.format(now)}`}>
      <span className='text-xs text-shell-muted'>{DATE.format(now)}</span>
      <span className='font-data text-base font-semibold'>{TIME.format(now)}</span>
    </time>
  );
}

export default ShiftClock;
