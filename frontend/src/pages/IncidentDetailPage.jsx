import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { api } from "../api/client.js";
import Card from "../components/Card.jsx";
import MapComponent from "../components/MapComponent.jsx";
import { TRUCK_TYPES } from "../labels.js";

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function IncidentDetailPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [next, setNext] = useState(null);
  const [truckPicks, setTruckPicks] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const load = useCallback(async () => {
    const data = await api(`/incidents/${id}`);
    setIncident(data);
    setTruckPicks({});
    setNext(data.status === "OPEN" ? await api(`/incidents/${id}/next-alarm`) : null);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const act = async (path, body) => {
    setBusy(true);
    setError("");
    try {
      await api(`/incidents/${id}/${path}`, { method: "POST", body });
      await load();
    } catch (e) {
      setError(e.message);
      await load().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (!incident) {
    return <div className='p-6'>{error ? <Alert severity='error'>{error}</Alert> : "Loading…"}</div>;
  }

  const open = incident.status === "OPEN";
  const levels = [...new Set(incident.units.map((u) => u.alarmLevel))];

  return (
    <div className='flex flex-col gap-4 p-4 lg:p-6'>
      <Link to='/incidents' className='text-sm text-blue-700'>
        ← All incidents
      </Link>
      <div className='flex flex-wrap items-start gap-3'>
        <div className='flex-1'>
          <h1 className='text-xl font-semibold'>{incident.locationLabel}</h1>
          <div className='text-sm text-gray-600'>
            {incident.barangay && `Brgy. ${incident.barangay.name}, ${incident.barangay.city.name} · `}
            Dispatched {new Date(incident.createdAt).toLocaleString()} by {incident.createdBy.fullName}
            {incident.closedAt && ` · Closed ${new Date(incident.closedAt).toLocaleString()} by ${incident.closedBy?.fullName}`}
          </div>
          {incident.notes && <div className='mt-1 text-sm'>{incident.notes}</div>}
        </div>
        <Chip color={open ? "error" : "default"} label={open ? `OPEN · ${incident.alarmLevel}` : "CLOSED"} />
        {open && (
          <Button variant='outlined' onClick={() => setConfirmClose(true)} disabled={busy}>
            Close incident
          </Button>
        )}
      </div>
      {error && <Alert severity='error' onClose={() => setError("")}>{error}</Alert>}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]'>
        <div className='h-72 overflow-hidden rounded border lg:h-96'>
          <MapComponent position={{ lat: incident.lat, lng: incident.lng }} onChange={() => {}} />
        </div>
        <Paper variant='outlined' className='overflow-x-auto'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Alarm</TableCell>
                <TableCell>Station</TableCell>
                <TableCell>Truck</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Released</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {levels.flatMap((level) =>
                incident.units
                  .filter((u) => u.alarmLevel === level)
                  .map((u, i) => (
                    <TableRow key={u.id}>
                      <TableCell className='whitespace-nowrap font-medium'>{i === 0 ? level : ""}</TableCell>
                      <TableCell>
                        <span className='mr-2 inline-block h-3 w-3 rounded-full align-middle' style={{ background: u.station.district.color }} />
                        {u.station.name}
                      </TableCell>
                      <TableCell>
                        {u.truck.callSign}
                        <div className='text-xs text-gray-500'>{TRUCK_TYPES[u.truck.type]}</div>
                      </TableCell>
                      <TableCell>{time(u.dispatchedAt)}</TableCell>
                      <TableCell>{u.releasedAt ? time(u.releasedAt) : "—"}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </div>

      {open && next && (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 p-3'>
            <span className='text-sm'>
              Next: <b>{next.alarmLevel}</b> — the nearest stations not yet on this incident, using live truck status.
            </span>
            <Button
              variant='contained'
              color='error'
              disabled={busy || next.stations.length === 0}
              onClick={() => act("raise", { truckPicks })}
            >
              Raise to {next.alarmLevel}
            </Button>
          </div>
          <Card
            runningCard={next.stations.length ? [{ alarmLevel: next.alarmLevel, stations: next.stations }] : []}
            truckPicks={truckPicks}
            onPickTruck={(stationId, truckId) => setTruckPicks((p) => ({ ...p, [stationId]: truckId }))}
          />
        </div>
      )}
      {open && !next && <Alert severity='info'>This incident is at the highest alarm level.</Alert>}

      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)}>
        <DialogTitle>Close this incident?</DialogTitle>
        <DialogContent>All its trucks go back to Available, except any Operations marked out of service.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={() => {
              setConfirmClose(false);
              act("close");
            }}
          >
            Close incident
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default IncidentDetailPage;
