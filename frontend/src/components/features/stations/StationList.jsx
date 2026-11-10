import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import { cn } from "@/lib/utils";
import AvailabilityMeter from "./AvailabilityMeter.jsx";

/** Searchable station directory with each station's truck availability. `hidden`: on small screens the detail is showing instead. */
function StationList({ stations, visible, isPending, search, onSearch, selectedId, onSelect, hidden }) {
  return (
    <section aria-label='Stations' className={cn("flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card lg:max-h-[calc(100svh-9rem)]", hidden && "hidden lg:flex")}>
      <div className='border-b bg-muted/40 p-2'>
        <div className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input className='bg-card pl-8' placeholder={`Search ${stations.length} stations`} value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
      </div>
      {isPending && <ListSkeleton className='p-3' />}
      <ul className='min-h-0 flex-1 divide-y overflow-auto'>
        {visible.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              aria-current={s.id === selectedId ? "true" : undefined}
              className={cn(
                "grid w-full gap-1 px-3 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none",
                s.id === selectedId && "bg-accent shadow-[inset_3px_0_0_var(--primary)]",
              )}
            >
              <span className='truncate text-sm font-medium'>{s.name}</span>
              <span className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                <span className='truncate'>{s.city?.name ?? "No city set"}</span>
                <AvailabilityMeter trucks={s.trucks} />
              </span>
            </button>
          </li>
        ))}
        {!isPending && visible.length === 0 && <li className='px-3 py-6 text-center text-sm text-muted-foreground'>No station matches.</li>}
      </ul>
    </section>
  );
}

export default StationList;
