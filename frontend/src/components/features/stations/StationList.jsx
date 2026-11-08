import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import { cn } from "@/lib/utils";

/** Searchable station list with available/total trucks. `hidden`: on small screens the detail is showing instead. */
function StationList({ stations, visible, isPending, search, onSearch, selectedId, onSelect, hidden }) {
  return (
    <Card className={cn("gap-0 py-0 lg:flex", hidden && "hidden")}>
      <div className='border-b p-3'>
        <div className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input className='pl-8' placeholder={`Search ${stations.length} stations`} value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
      </div>
      {isPending && <ListSkeleton className='p-3' />}
      <ul className='max-h-[65vh] divide-y overflow-auto'>
        {visible.map((s) => {
          const available = s.trucks.filter((t) => t.status === "AVAILABLE").length;
          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                className={cn(
                  "w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/60",
                  s.id === selectedId && "bg-accent shadow-[inset_3px_0_0_var(--primary)]",
                )}
              >
                <div className='truncate text-sm font-medium'>{s.name}</div>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  {s.city?.name ?? "No city set"}
                  <span className={cn("ml-auto tabular-nums", s.trucks.length && !available && "text-destructive")}>
                    {available}/{s.trucks.length} available
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default StationList;
