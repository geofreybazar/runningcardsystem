import { ChevronRight } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import Elapsed from "@/components/common/Elapsed.jsx";
import IncidentAlarmBadge from "@/components/features/incidents/IncidentAlarmBadge.jsx";
import { INCIDENT_STATUS } from "@/constants/status.js";
import { formatDateTime } from "@/utils/dateTime.js";

/** Phones: one tappable row per incident. */
function IncidentCard({ incident: i, onOpen }) {
  return (
    <li>
      <button type='button' onClick={onOpen} className='flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <StatusBadge tone={INCIDENT_STATUS[i.status].tone} pulse={i.status === "OPEN"}>
              {INCIDENT_STATUS[i.status].label}
            </StatusBadge>
            <IncidentAlarmBadge incident={i} />
            <span className='ml-auto font-data text-sm'>
              <Elapsed from={i.createdAt} to={i.closedAt} />
            </span>
          </div>
          <div className='mt-1 truncate font-medium'>{i.locationLabel}</div>
          <div className='text-xs text-muted-foreground'>
            {i.city?.name} · {formatDateTime(i.createdAt)} · {i._count.units} units
          </div>
        </div>
        <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
      </button>
    </li>
  );
}

export default IncidentCard;
