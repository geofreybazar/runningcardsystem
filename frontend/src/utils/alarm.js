/**
 * One escalation scale everywhere an alarm level appears: BFP red for the numbered alarms (1st–5th),
 * shell charcoal for the task forces, black with a gold ring for the general alarm.
 */
export function alarmTone(index) {
  if (index == null || index < 5) return "bg-primary text-primary-foreground";
  if (index < 9) return "bg-shell text-shell-foreground ring-1 ring-shell-border dark:bg-shell-raised";
  return "bg-black text-white ring-1 ring-gold";
}

/** "1:05:09" / "23:41" for a duration in ms. */
export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
