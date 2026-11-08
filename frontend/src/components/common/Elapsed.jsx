import { useEffect, useState } from "react";
import { formatElapsed } from "@/utils/alarm.js";

/** Ticks every second until `to` is set. */
function Elapsed({ from, to }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (to) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [to]);
  const end = to ? new Date(to).getTime() : now;
  return (
    <time className='font-condensed tabular-nums' dateTime={`PT${Math.floor((end - new Date(from).getTime()) / 1000)}S`}>
      {formatElapsed(end - new Date(from).getTime())}
    </time>
  );
}

export default Elapsed;
