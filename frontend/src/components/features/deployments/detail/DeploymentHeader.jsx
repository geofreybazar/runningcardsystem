import { CalendarRange, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeploymentStatusBadge from "@/components/features/deployments/DeploymentStatusBadge.jsx";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";

/** What, where, when, who; managers get Edit, Add trucks and End while it is active, and Delete at any time. */
function DeploymentHeader({ deployment: d, canManage, busy, onEdit, onAddTrucks, onEnd, onDelete }) {
  const active = d.status === "ACTIVE";
  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-start'>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <h1 className='text-xl font-semibold tracking-tight md:text-2xl'>{d.name}</h1>
          <DeploymentStatusBadge status={d.status} />
        </div>
        <p className='mt-1 flex items-center gap-1 text-sm text-muted-foreground'>
          <MapPin className='size-3.5 shrink-0' /> {d.locationLabel}
        </p>
        <p className='flex items-center gap-1 text-sm text-muted-foreground'>
          <CalendarRange className='size-3.5 shrink-0' /> {formatDateTime(d.startsAt)}
          {d.endsAt ? ` to ${formatDateTime(d.endsAt)}` : ", no planned end"}
        </p>
        <p className='text-sm text-muted-foreground'>Created by {displayName(d.createdBy)}</p>
        {d.endedAt && (
          <p className='text-sm text-muted-foreground'>
            Ended {formatDateTime(d.endedAt)} by {displayName(d.endedBy)}
          </p>
        )}
        {d.notes && <p className='mt-2 text-sm whitespace-pre-line'>{d.notes}</p>}
      </div>
      {canManage && (
        <div className='flex flex-wrap gap-2'>
          {active && (
            <>
              <Button variant='outline' onClick={onEdit} disabled={busy}>
                <Pencil /> Edit
              </Button>
              <Button onClick={onAddTrucks} disabled={busy}>
                <Plus /> Add trucks
              </Button>
              <Button variant='outline' className='text-destructive' onClick={onEnd} disabled={busy}>
                End deployment
              </Button>
            </>
          )}
          <Button variant='ghost' className='text-destructive hover:text-destructive' onClick={onDelete} disabled={busy}>
            <Trash2 /> Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export default DeploymentHeader;
