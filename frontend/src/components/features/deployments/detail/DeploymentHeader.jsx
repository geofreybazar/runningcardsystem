import { CalendarRange, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import KeyValue from "@/components/common/KeyValue.jsx";
import DeploymentStatusBadge from "@/components/features/deployments/DeploymentStatusBadge.jsx";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";
import { cn } from "@/lib/utils";

/** Status strip: state and schedule, then venue and who, then the managers' actions (Edit, Add trucks, End; Delete at any time). */
function DeploymentHeader({ deployment: d, canManage, busy, onEdit, onAddTrucks, onEnd, onDelete }) {
  const active = d.status === "ACTIVE";
  const stillThere = d.units.filter((u) => !u.releasedAt).length;
  return (
    <section aria-label='Deployment status' className='grid overflow-hidden rounded-lg border bg-card lg:grid-cols-[auto_minmax(0,1fr)_auto]'>
      <div className={cn("flex flex-col justify-center gap-1.5 border-b px-4 py-3 lg:border-r lg:border-b-0", active && "bg-info/5")}>
        <DeploymentStatusBadge status={d.status} />
        <div className='flex items-baseline gap-2'>
          <span className='font-data text-4xl leading-none font-semibold'>{stillThere}</span>
          <span className='text-xs text-muted-foreground'>truck{stillThere === 1 ? "" : "s"} on deployment</span>
        </div>
      </div>

      <div className='px-4 py-3'>
        <KeyValue
          columns={2}
          items={[
            { label: "Venue", value: d.locationLabel },
            {
              label: "Schedule",
              value: (
                <span className='flex items-center gap-1'>
                  <CalendarRange className='size-3.5 shrink-0 text-muted-foreground' />
                  {formatDateTime(d.startsAt)}
                  {d.endsAt ? ` to ${formatDateTime(d.endsAt)}` : ", no planned end"}
                </span>
              ),
            },
            { label: "Created by", value: displayName(d.createdBy) },
            d.endedAt && { label: "Ended at", value: `${formatDateTime(d.endedAt)} by ${displayName(d.endedBy)}` },
          ].filter(Boolean)}
        />
        {d.notes && <p className='mt-2 rounded-sm border-l-2 border-info bg-info/10 px-2 py-1 text-sm whitespace-pre-line'>{d.notes}</p>}
      </div>

      {canManage && (
        <div className='flex flex-wrap items-center gap-2 border-t px-4 py-3 lg:flex-col lg:items-stretch lg:justify-center lg:border-t-0 lg:border-l'>
          {active && (
            <>
              <Button size='sm' onClick={onAddTrucks} disabled={busy}>
                <Plus /> Add trucks
              </Button>
              <Button size='sm' variant='outline' onClick={onEdit} disabled={busy}>
                <Pencil /> Edit
              </Button>
              <Button size='sm' variant='outline' className='text-destructive' onClick={onEnd} disabled={busy}>
                End deployment
              </Button>
            </>
          )}
          <Button size='sm' variant='ghost' className='text-destructive hover:text-destructive' onClick={onDelete} disabled={busy}>
            <Trash2 /> Delete
          </Button>
        </div>
      )}
    </section>
  );
}

export default DeploymentHeader;
