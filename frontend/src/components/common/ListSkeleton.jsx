import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Placeholder rows while a list or table loads, so an empty state never flashes before the data. */
export default function ListSkeleton({ rows = 5, className }) {
  return (
    <div className={cn("grid gap-2", className)} aria-busy='true' aria-label='Loading'>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className='h-10 w-full rounded-sm' />
      ))}
    </div>
  );
}
