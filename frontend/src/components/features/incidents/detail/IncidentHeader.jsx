import { Button } from "@/components/ui/button";
import Elapsed from "@/components/common/Elapsed.jsx";
import OpenInGoogleMaps from "@/components/common/OpenInGoogleMaps.jsx";
import { alarmTone } from "@/utils/alarm.js";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";
import { cn } from "@/lib/utils";

/** Where and when, who dispatched/closed it, and the one loud element: alarm level and time since dispatch. */
function IncidentHeader({ incident, mine, busy, onClose }) {
  const open = incident.status === "OPEN";
  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-stretch'>
      <div className='min-w-0 flex-1'>
        <h1 className='text-xl font-semibold tracking-tight md:text-2xl'>{incident.locationLabel}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {incident.barangay ? `Brgy. ${incident.barangay.name}, ${incident.barangay.city.name}` : incident.city?.name}
        </p>
        <p className='text-sm text-muted-foreground'>
          Dispatched {formatDateTime(incident.createdAt)} by {displayName(incident.createdBy)}
        </p>
        {incident.closedAt && (
          <p className='text-sm text-muted-foreground'>
            Closed {formatDateTime(incident.closedAt)} by {displayName(incident.closedBy)}
          </p>
        )}
        {incident.notes && <p className='mt-2 text-sm'>{incident.notes}</p>}
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          {/* Everyone can open the fire in Google Maps, view-only offices too: it is for getting there. */}
          <OpenInGoogleMaps position={{ lat: incident.lat, lng: incident.lng }} />
          {mine && (
            <Button variant='outline' size='sm' onClick={onClose} disabled={busy}>
              Close incident
            </Button>
          )}
        </div>
      </div>
      {/* The one loud element: where the incident stands and for how long. */}
      <div
        className={cn(
          "flex min-w-56 flex-col justify-center rounded-xl px-5 py-3",
          open ? alarmTone(incident.alarmIndex) : "border bg-card text-card-foreground",
        )}
        aria-label={open ? `${incident.alarmLevel}, open` : `Closed at ${incident.alarmLevel}`}
      >
        <span className='font-condensed text-3xl leading-none font-bold'>{open ? incident.alarmLevel : "Closed"}</span>
        <span className={cn("mt-1 flex items-baseline gap-1.5 text-sm", open ? "opacity-90" : "text-muted-foreground")}>
          <span className='text-xl font-semibold'>
            <Elapsed from={incident.createdAt} to={incident.closedAt} />
          </span>
          {open ? "since dispatch" : `total, at ${incident.alarmLevel}`}
        </span>
      </div>
    </div>
  );
}

export default IncidentHeader;
