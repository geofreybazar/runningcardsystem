import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { WEEKDAYS, heatStep } from "@/lib/stats.js";

// Plain HTML/CSS charts (no chart library), following the dataviz skill: thin marks with 4px rounded data ends,
// 2px gaps, one BFP-red hue (--chart-*), values in text colours, a tooltip on hover AND keyboard focus on every
// mark, and a table view of the same data in every card.

const MARK = "outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-sm";
const HEAT = ["bg-muted", "bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

/** Value first, label second: the reader already knows the series and wants the number. */
function Tip({ value, label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <span className='font-semibold tabular-nums'>{value}</span> <span className='opacity-80'>{label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

/** A section card: title, optional note, and a Chart/Table toggle (`table`: { columns: [{ key, label, align }], rows }). */
export function ChartCard({ title, note, table, empty, children, className }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card className={cn("gap-3 px-4 py-4", className)}>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <h3 className='text-sm font-semibold'>{title}</h3>
          {note && <p className='text-xs text-muted-foreground'>{note}</p>}
        </div>
        {table && !empty && (
          <Button variant='ghost' size='sm' className='h-7 shrink-0 text-xs' onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? "Chart" : "Table"}
          </Button>
        )}
      </div>
      {empty ? (
        <p className='py-6 text-center text-sm text-muted-foreground'>{empty}</p>
      ) : asTable ? (
        <div className='max-h-80 overflow-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                {table.columns.map((c) => (
                  <TableHead key={c.key} className={c.align === "right" ? "text-right" : ""}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((r, i) => (
                <TableRow key={i}>
                  {table.columns.map((c) => (
                    <TableCell key={c.key} className={c.align === "right" ? "text-right tabular-nums" : ""}>
                      {r[c.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

/** A headline number. */
export function StatTile({ label, value, hint }) {
  return (
    <Card className='gap-1 px-4 py-3'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='font-condensed text-3xl leading-none font-semibold tabular-nums'>{value}</span>
      {hint && <span className='text-xs text-muted-foreground'>{hint}</span>}
    </Card>
  );
}

/** Ranked horizontal bars: label, bar, value. `items`: [{ label, value, display? }], already in the order to show. */
export function BarList({ items, unit = "" }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  return (
    <ul className='grid gap-[2px]'>
      {items.map((item) => {
        const display = item.display ?? `${item.value}${unit}`;
        return (
          <li key={item.label}>
            <Tip value={display} label={item.label}>
              <div tabIndex={0} aria-label={`${item.label}: ${display}`} className={cn("group grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 py-0.5", MARK)}>
                <span className='truncate text-sm'>{item.label}</span>
                <div className='h-3'>
                  <div
                    className='h-full rounded-r-[4px] bg-chart-bar transition-opacity group-hover:opacity-75 group-focus-visible:opacity-75'
                    style={{ width: `${max ? (item.value / max) * 100 : 0}%`, minWidth: item.value > 0 ? 2 : 0 }}
                  />
                </div>
                <span className='min-w-10 text-right font-condensed text-sm tabular-nums'>{display}</span>
              </div>
            </Tip>
          </li>
        );
      })}
    </ul>
  );
}

/** Columns along a time (or ordered) axis. `items`: [{ label, value }]; only the first, middle and last labels show. */
export function Columns({ items, unit = "", height = "h-40" }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  const shown = new Set([0, Math.floor((items.length - 1) / 2), items.length - 1]);
  return (
    <div className='grid gap-1'>
      <span className='text-xs text-muted-foreground tabular-nums'>{max ? `Max ${max}${unit}` : ""}</span>
      <div className={cn("flex items-end gap-[2px] border-b border-border", height)}>
        {items.map((item) => (
          <Tip key={item.label} value={`${item.value}${unit}`} label={item.label}>
            <div tabIndex={0} aria-label={`${item.label}: ${item.value}${unit}`} className={cn("group flex h-full min-w-0 flex-1 items-end", MARK)}>
              <div
                className='w-full rounded-t-[4px] bg-chart-bar transition-opacity group-hover:opacity-75 group-focus-visible:opacity-75'
                style={{ height: `${max ? (item.value / max) * 100 : 0}%`, minHeight: item.value > 0 ? 2 : 0 }}
              />
            </div>
          </Tip>
        ))}
      </div>
      <div className='relative h-4 text-xs text-muted-foreground'>
        {items.map((item, i) =>
          shown.has(i) ? (
            <span
              key={item.label}
              className='absolute whitespace-nowrap'
              style={i === 0 ? { left: 0 } : i === items.length - 1 ? { right: 0 } : { left: `${((i + 0.5) / items.length) * 100}%`, transform: "translateX(-50%)" }}
            >
              {item.label}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

/** Weekday x hour counts (7 x 24), one-hue ramp; empty cells stay neutral. */
export function HeatGrid({ grid }) {
  const max = Math.max(0, ...grid.flat());
  return (
    <div className='grid gap-2'>
      <div className='overflow-x-auto'>
        <div className='grid min-w-[36rem] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[2px]'>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className='text-center text-[10px] text-muted-foreground tabular-nums'>
              {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
            </span>
          ))}
          {grid.map((row, d) => [
            <span key={`d${d}`} className='self-center text-xs text-muted-foreground'>
              {WEEKDAYS[d]}
            </span>,
            ...row.map((v, h) => {
              const label = `${WEEKDAYS[d]} ${String(h).padStart(2, "0")}:00-${String(h + 1).padStart(2, "0")}:00`;
              const value = `${v} incident${v === 1 ? "" : "s"}`;
              return (
                <Tip key={`${d}-${h}`} value={value} label={label}>
                  <div tabIndex={0} aria-label={`${label}: ${value}`} className={cn("h-5 rounded-[3px] hover:ring-2 hover:ring-foreground/30", HEAT[heatStep(v, max)], MARK)} />
                </Tip>
              );
            }),
          ])}
        </div>
      </div>
      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        Fewer
        {HEAT.slice(1).map((c) => (
          <span key={c} className={cn("size-3 rounded-[3px]", c)} />
        ))}
        More <span className='ml-2'>(Manila time)</span>
      </div>
    </div>
  );
}
