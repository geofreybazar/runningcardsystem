import { cn } from "@/lib/utils";

/** Label / value rows. items: [{ label, value, mono? }]; empty values are skipped. */
function KeyValue({ items, className, columns = 1 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-2", columns === 2 && "sm:grid-cols-2", className)}>
      {items
        .filter((i) => i.value != null && i.value !== "")
        .map((i) => (
          <div key={i.label} className='min-w-0'>
            <dt className='text-label text-muted-foreground'>{i.label}</dt>
            <dd className={cn("truncate text-sm", i.mono && "font-data text-base")}>{i.value}</dd>
          </div>
        ))}
    </dl>
  );
}

export default KeyValue;
