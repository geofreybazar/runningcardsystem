import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/utils/dateTime.js";

/** Phones: one tappable card per deployment. */
function DeploymentCard({ deployment: d, onOpen }) {
  return (
    <Card className='cursor-pointer gap-1 px-4 py-3' onClick={onOpen}>
      <div className='flex items-center justify-between gap-2'>
        <span className='truncate font-medium'>{d.name}</span>
        <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
      </div>
      <div className='truncate text-sm'>{d.locationLabel}</div>
      <div className='flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground'>
        <span>From {formatDateTime(d.startsAt)}</span>
        {d.endsAt && <span>to {formatDateTime(d.endsAt)}</span>}
        <span className='ml-auto font-condensed text-sm tabular-nums'>{d._count.units} trucks</span>
      </div>
    </Card>
  );
}

export default DeploymentCard;
