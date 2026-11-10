import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import Page from "@/components/common/Page.jsx";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import Panel from "@/components/common/Panel.jsx";
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
import usePageTitle from "@/hooks/layout/usePageTitle.js";

function IncidentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [picked, setPicked] = useState({ next: null, picks: {} });
  const [confirmClose, setConfirmClose] = useState(false);

  const { data: incident } = useGetIncident(id);
  usePageTitle(incident?.locationLabel ?? "Incident", { to: "/incidents", label: "Incidents", aria: "All incidents" });
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
        <Skeleton className='h-24 w-full rounded-lg' />
        <Skeleton className='h-80 w-full rounded-lg' />
      </Page>
    );
  }

  const open = incident.status === "OPEN";
  const mine = open && canDispatchIn(user, incident.cityId); // only this city's dispatchers act on it

  return (
    <Page>
      <IncidentHeader incident={incident} mine={mine} busy={busy} onClose={() => setConfirmClose(true)} />

      {/* Command layout: situation on the left (map, log), resources and actions on the right. */}
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'>
        <div className='flex min-w-0 flex-col gap-4'>
          <Panel title='Map' meta='Fire and responding stations' flush>
            <div className='h-64 md:h-80'>
              <IncidentMap incident={incident} />
            </div>
          </Panel>
          <Timeline steps={incident.timeline} />
        </div>

        <div className='flex min-w-0 flex-col gap-4'>
          <UnitsTable incident={incident} />
          {open && !mine && (
            <p className='rounded-md border border-info/35 bg-info/10 px-3 py-2 text-sm text-info-foreground'>
              View only: the {incident.city?.name ?? "city"} office raises the alarm and closes this incident.
            </p>
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
          {mine && !nextPending && !next && (
            <p className='rounded-md border px-3 py-2 text-sm text-muted-foreground'>This incident is at the highest alarm level.</p>
          )}
          {mine && <RequestSpecialUnit incident={incident} disabled={busy} />}
        </div>
      </div>

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
