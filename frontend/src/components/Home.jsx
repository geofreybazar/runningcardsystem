import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import Card from "./Card.jsx";
import LocationSearch from "./LocationSearch.jsx";
import MapComponent from "./MapComponent.jsx";

function Home() {
  const [location, setLocation] = useState(null);
  const [label, setLabel] = useState("");
  const [runningCard, setRunningCard] = useState(null);
  const [truckPicks, setTruckPicks] = useState({}); // stationId -> truckId; default is the station's first available truck
  const [error, setError] = useState("");
  const [barangayId, setBarangayId] = useState(null);
  const [dispatchForm, setDispatchForm] = useState(null); // { locationLabel, notes }
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // The card is built on the server from live truck status, so it is refetched for every new location.
  useEffect(() => {
    if (!location) return;
    let stale = false;
    setError("");
    api(`/running-card?lat=${location.lat}&lng=${location.lng}`)
      .then((card) => {
        if (stale) return;
        setRunningCard(card);
        setTruckPicks({});
      })
      .catch((e) => !stale && setError(e.message));
    return () => {
      stale = true;
    };
  }, [location]);

  const handleSelect = (point, text, pickedBarangayId = null) => {
    setLocation(point);
    setLabel(text);
    setBarangayId(pickedBarangayId);
  };

  const dispatch = async () => {
    setBusy(true);
    try {
      const incident = await api("/incidents", {
        method: "POST",
        body: {
          ...location,
          locationLabel: dispatchForm.locationLabel.trim() || label,
          notes: dispatchForm.notes.trim() || undefined,
          barangayId: barangayId ?? undefined,
          truckPicks,
        },
      });
      navigate(`/incidents/${incident.id}`);
    } catch (e) {
      setError(e.message);
      setDispatchForm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className='grid grid-cols-1 gap-6 p-4 lg:grid-cols-[minmax(360px,2fr)_3fr] lg:p-6'>
      <section className='flex flex-col gap-3'>
        <LocationSearch onSelect={handleSelect} />
        <div className='h-[420px] overflow-hidden rounded border lg:h-[560px]'>
          <MapComponent position={location} onChange={(p) => handleSelect(p, "Pinned on map")} />
        </div>
        {location && (
          <div className='text-sm text-gray-700'>
            <div className='font-medium'>{label}</div>
            <div className='font-mono'>
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        )}
        <p className='text-xs text-gray-500'>Click the map or drag the pin to adjust the location.</p>
      </section>

      <section className='flex flex-col gap-3'>
        {error && <Alert severity='error'>{error}</Alert>}
        {runningCard?.length > 0 && (
          <div className='flex items-center justify-between gap-3 rounded border border-red-200 bg-red-50 p-3'>
            <span className='text-sm'>
              Dispatch sends one truck from each <b>{runningCard[0].alarmLevel}</b> station and marks it Responding.
            </span>
            <Button variant='contained' color='error' onClick={() => setDispatchForm({ locationLabel: label, notes: "" })}>
              Dispatch
            </Button>
          </div>
        )}
        <Card
          runningCard={runningCard}
          truckPicks={truckPicks}
          onPickTruck={(stationId, truckId) => setTruckPicks((p) => ({ ...p, [stationId]: truckId }))}
        />
      </section>

      <Dialog open={!!dispatchForm} onClose={() => !busy && setDispatchForm(null)} fullWidth maxWidth='sm'>
        <DialogTitle>Dispatch {runningCard?.[0]?.alarmLevel}</DialogTitle>
        {dispatchForm && (
          <DialogContent className='flex flex-col gap-4' sx={{ pt: "8px !important" }}>
            <TextField
              label='Location'
              value={dispatchForm.locationLabel}
              onChange={(e) => setDispatchForm({ ...dispatchForm, locationLabel: e.target.value })}
              helperText='Edit to add details, e.g. house number or building name'
            />
            <TextField
              label='Notes (optional)'
              multiline
              minRows={2}
              value={dispatchForm.notes}
              onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
            />
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setDispatchForm(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant='contained' color='error' onClick={dispatch} disabled={busy}>
            Dispatch now
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

export default Home;
