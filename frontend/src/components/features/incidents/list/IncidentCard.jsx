import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import IncidentAlarmBadge from "@/components/features/incidents/IncidentAlarmBadge.jsx";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";

/** Phones: one tappable card per incident. */
function IncidentCard({ incident, onOpen }) {
  return (
    <Card className='cursor-pointer gap-1 px-4 py-3' onClick={onOpen}>
      <div className='flex items-center justify-between gap-2'>
        <span className='truncate font-medium'>{incident.locationLabel}</span>
        <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <IncidentAlarmBadge incident={incident} />
        <span className='text-sm'>{incident.city?.name}</span>
        <span className='ml-auto font-condensed text-sm tabular-nums text-muted-foreground'>{incident._count.units} units</span>
      </div>
      <div className='text-xs text-muted-foreground'>
        {formatDateTime(incident.createdAt)}, by {displayName(incident.createdBy)}
      </div>
    </Card>
  );
}

export default IncidentCard;
