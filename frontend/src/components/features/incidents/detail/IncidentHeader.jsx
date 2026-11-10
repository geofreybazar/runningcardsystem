import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Elapsed from "@/components/common/Elapsed.jsx";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import KeyValue from "@/components/common/KeyValue.jsx";
import OpenInGoogleMaps from "@/components/common/OpenInGoogleMaps.jsx";
import { INCIDENT_STATUS } from "@/constants/status.js";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";
import { cn } from "@/lib/utils";

/**
 * The incident's status strip. Left, the one loud element: status, alarm level and the clock since dispatch.
 * Then where and who; then the actions (directions for everyone, Close for the fire city's dispatchers).
 */
function IncidentHeader({ incident, mine, busy, onClose }) {
  const open = incident.status === "OPEN";
  const status = INCIDENT_STATUS[incident.status];
  return (
    <section aria-label='Incident status' className='grid overflow-hidden rounded-lg border bg-card lg:grid-cols-[auto_minmax(0,1fr)_auto]'>
      <div className={cn("flex flex-col justify-center gap-1.5 border-b px-4 py-3 lg:border-r lg:border-b-0", open && "bg-danger/5")}>
        <div className='flex items-center gap-2'>
          <StatusBadge tone={status.tone} pulse={open}>
            {status.label}
          </StatusBadge>
          <AlarmBadge level={incident.alarmLevel} index={incident.alarmIndex} closed={!open} className='text-base' />
        </div>
        <div className='flex items-baseline gap-2'>
          <span className='font-data text-4xl leading-none font-semibold'>
            <Elapsed from={incident.createdAt} to={incident.closedAt} />
          </span>
          <span className='text-xs text-muted-foreground'>{open ? "since dispatch" : "total"}</span>
        </div>
      </div>

      <div className='px-4 py-3'>
        <KeyValue
          columns={2}
          items={[
            { label: "Place", value: incident.barangay ? `Brgy. ${incident.barangay.name}, ${incident.barangay.city.name}` : incident.city?.name },
            { label: "Coordinates", value: `${incident.lat.toFixed(6)}, ${incident.lng.toFixed(6)}`, mono: true },
            { label: "Dispatched", value: `${formatDateTime(incident.createdAt)} by ${displayName(incident.createdBy)}` },
            incident.closedAt && { label: "Closed", value: `${formatDateTime(incident.closedAt)} by ${displayName(incident.closedBy)}` },
          ].filter(Boolean)}
        />
        {incident.notes && <p className='mt-2 rounded-sm border-l-2 border-warning bg-warning/10 px-2 py-1 text-sm whitespace-pre-line'>{incident.notes}</p>}
      </div>

      <div className='flex flex-wrap items-center gap-2 border-t px-4 py-3 lg:flex-col lg:items-stretch lg:justify-center lg:border-t-0 lg:border-l'>
        {/* Everyone can open the fire in Google Maps, view-only offices too: it is for getting there. */}
        <OpenInGoogleMaps position={{ lat: incident.lat, lng: incident.lng }} />
        {mine && (
          <Button variant='outline' size='sm' onClick={onClose} disabled={busy} className='border-danger/40 text-danger-foreground hover:bg-danger/10'>
            <XCircle /> Close incident
          </Button>
        )}
      </div>
    </section>
  );
}

export default IncidentHeader;
