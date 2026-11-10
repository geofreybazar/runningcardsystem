import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Page from "@/components/common/Page.jsx";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import IncidentHeader from "@/components/features/incidents/detail/IncidentHeader.jsx";
import IncidentMap from "@/components/features/incidents/detail/IncidentMap.jsx";
import UnitsTable from "@/components/features/incidents/detail/UnitsTable.jsx";
import Timeline from "@/components/features/incidents/detail/Timeline.jsx";
import RaiseAlarm from "@/components/features/incidents/detail/RaiseAlarm.jsx";
import RequestSpecialUnit from "@/components/features/incidents/detail/RequestSpecialUnit.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useNotifications from "@/hooks/notifications/useNotifications.js";
import useGetIncident from "@/hooks/incidents/useGetIncident.js";
import useGetNextAlarm from "@/hooks/incidents/useGetNextAlarm.js";
import useRaiseAlarm from "@/hooks/incidents/useRaiseAlarm.js";
import useCloseIncident from "@/hooks/incidents/useCloseIncident.js";
import { canDispatchIn } from "@/utils/permissions.js";

function IncidentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [picked, setPicked] = useState({ next: null, picks: {} });
  const [confirmClose, setConfirmClose] = useState(false);

  const { data: incident } = useGetIncident(id);
  const canRaise = incident?.status === "OPEN" && canDispatchIn(user, incident.cityId);
  const { data: next = null, isPending: nextPending } = useGetNextAlarm(id, canRaise);
  const raise = useRaiseAlarm();
  const close = useCloseIncident();
  const busy = raise.isPending || close.isPending; // includes the reload after it
  // Picks belong to the card they were made on: a new card (after a raise, or a truck changing status) starts over.
  const truckPicks = picked.next === next ? picked.picks : {};

  const { viewIncident } = useNotifications();
  useEffect(() => viewIncident(id), [id, viewIncident]); // on screen = its notifications are read

  if (!incident) {
    return (
      <Page>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-72 w-full' />
      </Page>
    );
  }

  const open = incident.status === "OPEN";
  const mine = open && canDispatchIn(user, incident.cityId); // only this city's dispatchers act on it

  return (
    <Page>
      <Link to='/incidents' className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
        <ChevronLeft className='size-4' /> All incidents
      </Link>

      <IncidentHeader incident={incident} mine={mine} busy={busy} onClose={() => setConfirmClose(true)} />

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]'>
        <div className='h-64 overflow-hidden rounded-xl border md:h-80 xl:h-full xl:min-h-80'>
          <IncidentMap incident={incident} />
        </div>
        <UnitsTable incident={incident} />
      </div>

      <Timeline steps={incident.timeline} />

      {open && !mine && (
        <p className='text-sm text-muted-foreground'>View only: the {incident.city?.name ?? "city"} office raises the alarm and closes this incident.</p>
      )}
      {mine && next && (
        <RaiseAlarm
          incident={incident}
          next={next}
          truckPicks={truckPicks}
          onPickTruck={(stationId, truckId) => setPicked({ next, picks: { ...truckPicks, [stationId]: truckId } })}
          busy={busy}
          onRaise={() => raise.mutate({ id, truckPicks, alarmLevel: next.alarmLevel })}
        />
      )}
      {mine && !nextPending && !next && <p className='text-sm text-muted-foreground'>This incident is at the highest alarm level.</p>}
      {mine && <RequestSpecialUnit incident={incident} disabled={busy} />}

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title='Close this incident?'
        description='All its trucks go back to Available, except any Operations marked out of service.'
        confirmLabel='Close incident'
        onConfirm={() => close.mutate(id)}
      />
    </Page>
  );
}

export default IncidentDetailPage;
