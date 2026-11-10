import { ChevronRight } from "lucide-react";
import DeploymentStatusBadge from "@/components/features/deployments/DeploymentStatusBadge.jsx";
import { formatDateTime } from "@/utils/dateTime.js";

/** Phones: one tappable row per deployment. */
function DeploymentCard({ deployment: d, onOpen }) {
  return (
    <li>
      <button type='button' onClick={onOpen} className='flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <DeploymentStatusBadge status={d.status} />
            <span className='truncate font-medium'>{d.name}</span>
            <span className='ml-auto shrink-0 font-data text-sm'>{d._count.units} trucks</span>
          </div>
          <div className='mt-0.5 truncate text-sm'>{d.locationLabel}</div>
          <div className='text-xs text-muted-foreground'>
            {formatDateTime(d.startsAt)}
            {d.endsAt && ` to ${formatDateTime(d.endsAt)}`}
          </div>
        </div>
        <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
      </button>
    </li>
  );
}

export default DeploymentCard;
