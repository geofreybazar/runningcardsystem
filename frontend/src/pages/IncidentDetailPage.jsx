import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, CircleCheck, LoaderCircle, Siren, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card as Panel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Page from "@/components/Page.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import Card from "@/components/Card.jsx";
import MapComponent from "@/components/MapComponent.jsx";
import { api } from "@/api/client.js";
import { useAuth } from "@/auth/AuthContext.jsx";
import { canDispatchIn } from "@/auth/permissions.js";
import { displayName } from "@/lib/person.js";
import { TRUCK_TYPES } from "@/labels.js";
import { useNotifications } from "@/components/Notifications.jsx";
import { AlarmBadge, Elapsed } from "@/components/Alarm.jsx";
import { alarmTone } from "@/lib/alarm.js";
import { cn } from "@/lib/utils";

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const when = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

const STEP = {
  DISPATCHED: { icon: Siren, label: (s) => `${s.alarmLevel} dispatched`, verb: "sent" },
  ALARM_RAISED: { icon: TrendingUp, label: (s) => `Raised to ${s.alarmLevel}`, verb: "sent" },
  INCIDENT_CLOSED: { icon: CircleCheck, label: () => "Incident closed", verb: "released" },
};

/** Time log: when each alarm was dispatched or raised, and the close, with who did it. */
function Timeline({ steps }) {
  if (!steps?.length) return null;
  return (
    <Panel className='gap-3 px-4 py-4'>
      <h2 className='text-sm font-semibold'>Time log</h2>
      <ol className='relative grid gap-4 border-l pl-5'>
        {steps.map((s, i) => {
          const { icon: Icon, label, verb } = STEP[s.type];
          const closed = s.type === "INCIDENT_CLOSED";
          // Each dispatch/raise is one level up the scale; the close is shown neutral.
          const index = steps.slice(0, i).filter((p) => p.type !== "INCIDENT_CLOSED").length;
          return (
            <li key={i} className='relative'>
              <span
                className={cn(
                  "absolute top-0.5 -left-[1.95rem] flex size-5 items-center justify-center rounded-full",
                  closed ? "border bg-card text-success" : alarmTone(index),
                )}
              >
                <Icon className='size-3' />
              </span>
              <div className='flex flex-wrap items-baseline gap-x-3'>
                <span className='text-sm font-medium'>{label(s)}</span>
                <time className='text-sm tabular-nums text-muted-foreground' dateTime={s.at}>
                  {when(s.at)}
                </time>
              </div>
              <p className='text-xs text-muted-foreground'>
                {s.trucks} truck{s.trucks === 1 ? "" : "s"} {verb}
                {s.by && `, by ${displayName(s.by)}`}
              </p>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/** One pin per responding station, in its district colour. */
function stationMarkers(units) {
  const byStation = new Map(units.map((u) => [u.station.id, u.station]));
  return [...byStation.values()].map((s) => ({ id: s.id, position: { lat: s.lat, lng: s.lng }, color: s.district.color, title: s.name }));
}

function IncidentMap({ lat, lng, markers }) {
  const position = useMemo(() => ({ lat, lng }), [lat, lng]); // stable, so the map only refits when something changes
  return <MapComponent position={position} markers={markers} />;
}

function IncidentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState({ next: null, picks: {} });
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Live notifications invalidate ["incident", id], so a raise or close by another office shows here at once.
  const { data: incident } = useQuery({ queryKey: ["incident", id], queryFn: () => api(`/incidents/${id}`) });
  const canRaise = incident?.status === "OPEN" && canDispatchIn(user, incident.cityId);
  const { data: next = null, isPending: nextPending } = useQuery({
    queryKey: ["incident", id, "next-alarm"],
    queryFn: () => api(`/incidents/${id}/next-alarm`),
    enabled: canRaise,
    staleTime: 0, // built from live truck status
  });
  // Picks belong to the card they were made on: a new card (after a raise, or a truck changing status) starts over.
  const truckPicks = picked.next === next ? picked.picks : {};

  const { viewIncident } = useNotifications();
  useEffect(() => viewIncident(id), [id, viewIncident]); // on screen = its notifications are read

  const act = async (path, body, success) => {
    setBusy(true);
    try {
      await api(`/incidents/${id}/${path}`, { method: "POST", body });
      toast.success(success);
    } catch (e) {
      toast.error(e.message);
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["incident", id] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setBusy(false);
    }
  };

  if (!incident) {
    return (
      <Page>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-72 w-full' />
      </Page>
    );
  }

  const open = incident.status === "OPEN";
  const markers = stationMarkers(incident.units);
  const mine = open && canDispatchIn(user, incident.cityId); // only this city's dispatchers act on it
  const levels = [...new Set(incident.units.map((u) => u.alarmLevel))];

  return (
    <Page>
      <Link to='/incidents' className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
        <ChevronLeft className='size-4' /> All incidents
      </Link>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-stretch'>
        <div className='min-w-0 flex-1'>
          <h1 className='text-xl font-semibold tracking-tight md:text-2xl'>{incident.locationLabel}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {incident.barangay ? `Brgy. ${incident.barangay.name}, ${incident.barangay.city.name}` : incident.city?.name}
          </p>
          <p className='text-sm text-muted-foreground'>
            Dispatched {when(incident.createdAt)} by {displayName(incident.createdBy)}
          </p>
          {incident.closedAt && (
            <p className='text-sm text-muted-foreground'>
              Closed {when(incident.closedAt)} by {displayName(incident.closedBy)}
            </p>
          )}
          {incident.notes && <p className='mt-2 text-sm'>{incident.notes}</p>}
          {mine && (
            <Button variant='outline' className='mt-3' onClick={() => setConfirmClose(true)} disabled={busy}>
              Close incident
            </Button>
          )}
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

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]'>
        <div className='h-64 overflow-hidden rounded-xl border md:h-80 xl:h-full xl:min-h-80'>
          <IncidentMap lat={incident.lat} lng={incident.lng} markers={markers} />
        </div>
        <Panel className='py-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alarm</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Released</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.flatMap((level) =>
                  incident.units
                    .filter((u) => u.alarmLevel === level)
                    .map((u, i) => (
                      <TableRow key={u.id}>
                        <TableCell className='whitespace-nowrap'>{i === 0 && <AlarmBadge level={level} index={levels.indexOf(level)} closed={!open} />}</TableCell>
                        <TableCell>
                          <span className='flex items-center gap-2'>
                            <span className='size-2.5 shrink-0 rounded-full' style={{ background: u.station.district.color }} />
                            <span>
                              {u.station.name}
                              {u.station.city && <span className='block text-xs text-muted-foreground'>{u.station.city.name}</span>}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className='font-condensed text-base font-semibold'>
                          {u.truck.callSign}
                          <div className='font-sans text-xs font-normal text-muted-foreground'>{TRUCK_TYPES[u.truck.type]}</div>
                        </TableCell>
                        <TableCell className='tabular-nums'>{time(u.dispatchedAt)}</TableCell>
                        <TableCell className='tabular-nums text-muted-foreground'>{u.releasedAt ? time(u.releasedAt) : "—"}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </div>

      <Timeline steps={incident.timeline} />

      {open && !mine && (
        <p className='text-sm text-muted-foreground'>View only: the {incident.city?.name ?? "city"} office raises the alarm and closes this incident.</p>
      )}
      {mine && next && (
        <section className='flex flex-col gap-3'>
          <div className='flex flex-col gap-3 rounded-xl border border-primary/20 bg-accent p-3 sm:flex-row sm:items-center'>
            <Siren className='hidden size-5 shrink-0 text-primary sm:block' />
            <p className='flex-1 text-sm'>
              Next: <b>{next.alarmLevel}</b> — the nearest stations not yet on this incident, from live truck status.
            </p>
            <Button disabled={busy || next.stations.length === 0} onClick={() => act("raise", { truckPicks }, `Raised to ${next.alarmLevel}`)}>
              {busy && <LoaderCircle className='animate-spin' />} Raise to {next.alarmLevel}
            </Button>
          </div>
          <Card
            runningCard={next.stations.length ? [{ alarmLevel: next.alarmLevel, index: incident.alarmIndex + 1, stations: next.stations }] : []}
            truckPicks={truckPicks}
            onPickTruck={(stationId, truckId) => setPicked({ next, picks: { ...truckPicks, [stationId]: truckId } })}
          />
        </section>
      )}
      {mine && !nextPending && !next && <p className='text-sm text-muted-foreground'>This incident is at the highest alarm level.</p>}

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title='Close this incident?'
        description='All its trucks go back to Available, except any Operations marked out of service.'
        confirmLabel='Close incident'
        onConfirm={() => act("close", undefined, "Incident closed")}
      />
    </Page>
  );
}

export default IncidentDetailPage;
