import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Panel from "@/components/common/Panel.jsx";
import { TRUCK_STATUS, TRUCK_TYPES } from "@/constants/truck.js";
import { RUNNING_CARD_TRUCK_TYPES, SPECIAL_TRUCK_TYPES } from "@shared/validation";
import { resourceCounts } from "@/utils/resourceCounts.js";
import { cn } from "@/lib/utils";
import { districtName } from "@/utils/permissions.js";

const TYPES = [...RUNNING_CARD_TRUCK_TYPES, ...SPECIAL_TRUCK_TYPES];
const STORAGE_KEY = "rcs-resources-open";

const readOpen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

/** "3/5", "—" for none; red when none of several is available. The tooltip spells out every status. */
function Count({ cell, strong }) {
  if (!cell.total) return <span className='text-muted-foreground/60'>—</span>;
  const breakdown = Object.entries(cell.statuses ?? {})
    .map(([s, n]) => `${n} ${TRUCK_STATUS[s]?.label.toLowerCase() ?? s}`)
    .join(", ");
  return (
    <span title={breakdown || undefined} className={cn("font-data text-base", strong && "font-semibold", cell.available === 0 && "text-danger-foreground")}>
      {cell.available}
      <span className='text-muted-foreground'>/{cell.total}</span>
    </span>
  );
}

/**
 * Resources at a glance: trucks per type, available of total, for each district (region view), each city of a
 * district, or the one chosen city. Counted from the station list already on the page.
 */
function ResourceSummary({ stations, groupBy, totalLabel }) {
  const [open, setOpen] = useState(readOpen);
  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(!o));
      } catch {
        // storage blocked: the panel still toggles for this visit
      }
      return !o;
    });
  };
  const { rows, sum } = resourceCounts(stations, groupBy, TYPES);
  const total = { label: totalLabel, byType: sum.byType, total: sum.total };

  return (
    <Panel
      title='Resources'
      meta={`${sum.total.available} of ${sum.total.total} trucks available`}
      actions={
        <Button variant='ghost' size='sm' onClick={toggle} aria-expanded={open} aria-controls='resource-summary'>
          {open ? "Hide" : "Show"} <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
        </Button>
      }
      flush
      className='shrink-0'
    >
      {open && (
        <div id='resource-summary' className='max-h-[35svh] overflow-auto'>
          <Table aria-label='Resources by type, available of total'>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead rowSpan={2} className='sticky left-0 z-[1] bg-muted align-bottom'>
                  {groupBy === "district" ? "District" : "City"}
                </TableHead>
                <TableHead colSpan={RUNNING_CARD_TRUCK_TYPES.length} className='border-l text-center'>
                  Running card
                </TableHead>
                <TableHead colSpan={SPECIAL_TRUCK_TYPES.length} className='border-l text-center'>
                  Special units
                </TableHead>
                <TableHead rowSpan={2} className='border-l text-right align-bottom'>
                  All
                </TableHead>
              </TableRow>
              <TableRow className='hover:bg-transparent'>
                {TYPES.map((t, i) => (
                  <TableHead key={t} className={cn("text-right whitespace-nowrap", (i === 0 || i === RUNNING_CARD_TRUCK_TYPES.length) && "border-l")}>
                    {TRUCK_TYPES[t]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows, ...(rows.length > 1 ? [{ ...total, key: "total", isTotal: true }] : [])].map((r) => (
                <TableRow key={r.key} className={cn(r.isTotal && "bg-muted/50 font-semibold hover:bg-muted/50")}>
                  <TableCell className={cn("sticky left-0 z-[1] whitespace-nowrap", r.isTotal ? "bg-muted" : "bg-card")}>
                    <span className='flex items-center gap-2'>
                      {r.color && <span className='size-2.5 shrink-0 rounded-[2px]' style={{ background: r.color }} aria-hidden='true' />}
                      {r.district ? districtName(r.district) : r.label}
                    </span>
                  </TableCell>
                  {TYPES.map((t, i) => (
                    <TableCell key={t} className={cn("text-right", (i === 0 || i === RUNNING_CARD_TRUCK_TYPES.length) && "border-l")}>
                      <Count cell={r.byType[t]} strong={r.isTotal} />
                    </TableCell>
                  ))}
                  <TableCell className='border-l text-right'>
                    <Count cell={r.total} strong />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Panel>
  );
}

export default ResourceSummary;
