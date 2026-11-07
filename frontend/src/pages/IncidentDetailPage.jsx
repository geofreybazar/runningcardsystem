import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, LoaderCircle, Siren } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const when = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

function IncidentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [next, setNext] = useState(null);
  const [truckPicks, setTruckPicks] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const load = useCallback(async () => {
    const data = await api(`/incidents/${id}`);
    setIncident(data);
    setTruckPicks({});
    setNext(data.status === "OPEN" && canDispatchIn(user, data.cityId) ? await api(`/incidents/${id}/next-alarm`) : null);
  }, [id, user]);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  const act = async (path, body, success) => {
    setBusy(true);
    try {
      await api(`/incidents/${id}/${path}`, { method: "POST", body });
      toast.success(success);
    } catch (e) {
      toast.error(e.message);
    } finally {
      await load().catch(() => {});
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
  const mine = open && canDispatchIn(user, incident.cityId); // only this city's dispatchers act on it
  const levels = [...new Set(incident.units.map((u) => u.alarmLevel))];

  return (
    <Page>
      <Link to='/incidents' className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
        <ChevronLeft className='size-4' /> All incidents
      </Link>

      <div className='flex flex-wrap items-start gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-xl font-semibold tracking-tight md:text-2xl'>{incident.locationLabel}</h1>
            {open ? <Badge>OPEN · {incident.alarmLevel}</Badge> : <Badge variant='secondary'>CLOSED</Badge>}
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>
            {incident.barangay ? `Brgy. ${incident.barangay.name}, ${incident.barangay.city.name} · ` : incident.city && `${incident.city.name} · `}
            Dispatched {when(incident.createdAt)} by {displayName(incident.createdBy)}
            {incident.closedAt && ` · Closed ${when(incident.closedAt)} by ${displayName(incident.closedBy)}`}
          </p>
          {incident.notes && <p className='mt-2 text-sm'>{incident.notes}</p>}
        </div>
        {mine && (
          <Button variant='outline' onClick={() => setConfirmClose(true)} disabled={busy}>
            Close incident
          </Button>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]'>
        <div className='h-64 overflow-hidden rounded-xl border md:h-80 xl:h-full xl:min-h-80'>
          <MapComponent position={{ lat: incident.lat, lng: incident.lng }} onChange={() => {}} />
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
                        <TableCell className='whitespace-nowrap font-medium'>{i === 0 ? level : ""}</TableCell>
                        <TableCell>
                          <span className='flex items-center gap-2'>
                            <span className='size-2.5 shrink-0 rounded-full' style={{ background: u.station.district.color }} />
                            {u.station.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {u.truck.callSign}
                          <div className='text-xs text-muted-foreground'>{TRUCK_TYPES[u.truck.type]}</div>
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
            runningCard={next.stations.length ? [{ alarmLevel: next.alarmLevel, stations: next.stations }] : []}
            truckPicks={truckPicks}
            onPickTruck={(stationId, truckId) => setTruckPicks((p) => ({ ...p, [stationId]: truckId }))}
          />
        </section>
      )}
      {mine && !next && <p className='text-sm text-muted-foreground'>This incident is at the highest alarm level.</p>}

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
