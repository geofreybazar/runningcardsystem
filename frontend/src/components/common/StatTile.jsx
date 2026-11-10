import { cn } from "@/lib/utils";

/** One figure in a KPI strip: label, big tabular value, optional note. Meant to sit in a bordered, divided row. */
function StatTile({ label, value, note, tone, className }) {
  return (
    <div className={cn("min-w-0 px-4 py-3", className)}>
      <div className='text-label text-muted-foreground'>{label}</div>
      <div className={cn("font-data text-3xl leading-tight font-semibold", tone === "danger" && "text-danger-foreground")}>{value}</div>
      {note && <div className='truncate text-xs text-muted-foreground'>{note}</div>}
    </div>
  );
}

export default StatTile;
