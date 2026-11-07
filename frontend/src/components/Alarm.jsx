import { useEffect, useState, useSyncExternalStore } from "react";
import { api } from "@/api/client.js";
import { alarmTone, formatElapsed } from "@/lib/alarm.js";
import { applyTheme } from "@/lib/theme.js";
import { cn } from "@/lib/utils";

let levels = null; // Settings.alarmLevels, fetched once per page load
let levelsPromise = null;

/** Position of an alarm level name in the settings (for its colour), or null while loading. */
export function useAlarmIndex() {
  const [list, setList] = useState(levels);
  useEffect(() => {
    if (levels) return;
    levelsPromise ??= api("/settings").then((s) => (levels = s.alarmLevels), () => (levelsPromise = null));
    levelsPromise?.then((l) => l && setList(l));
  }, []);
  return (name) => {
    const i = list?.indexOf(name) ?? -1;
    return i < 0 ? null : i;
  };
}

/** Alarm level pill on the shared escalation scale; closed incidents are muted. */
export function AlarmBadge({ level, index, closed, className }) {
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

/** Ticks every second until `to` is set. */
export function Elapsed({ from, to }) {
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

const subscribe = (cb) => {
  window.addEventListener("rcs-theme", cb);
  return () => window.removeEventListener("rcs-theme", cb);
};

/** Current theme ("light" | "dark") and a toggle. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  return [theme, () => applyTheme(theme === "dark" ? "light" : "dark")];
}

