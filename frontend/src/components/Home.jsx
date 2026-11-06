import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, LoaderCircle, MapPin, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/Field.jsx";
import { api } from "@/api/client.js";
import { useAuth } from "@/auth/AuthContext.jsx";
import { canDispatchIn } from "@/auth/permissions.js";
import Card from "./Card.jsx";
import LocationSearch from "./LocationSearch.jsx";
import MapComponent from "./MapComponent.jsx";

function Home() {
  const [location, setLocation] = useState(null);
  const [label, setLabel] = useState("");
  const [barangayId, setBarangayId] = useState(null);
  const { user } = useAuth();
  const [runningCard, setRunningCard] = useState(null);
  const [city, setCity] = useState(null); // NCR city of the pin; its dispatchers own the incident
  const [loading, setLoading] = useState(false);
  const [truckPicks, setTruckPicks] = useState({}); // stationId -> truckId; default is the station's first available truck
  const [dispatchForm, setDispatchForm] = useState(null); // { locationLabel, notes }
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // The card is built on the server from live truck status, so it is refetched for every new location.
  useEffect(() => {
    if (!location) return;
    let stale = false;
    setLoading(true);
    api(`/running-card?lat=${location.lat}&lng=${location.lng}`)
      .then(({ city, alarms }) => {
        if (stale) return;
        setRunningCard(alarms);
        setCity(city);
        setTruckPicks({});
      })
      .catch((e) => !stale && toast.error(e.message))
      .finally(() => !stale && setLoading(false));
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
      toast.success(`${incident.alarmLevel} dispatched`);
      navigate(`/incidents/${incident.id}`);
    } catch (e) {
      toast.error(e.message);
      setDispatchForm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='grid grid-cols-1 gap-4 p-4 md:p-6 xl:grid-cols-[minmax(380px,5fr)_7fr]'>
      <section className='flex flex-col gap-3'>
        <LocationSearch onSelect={handleSelect} />
        <div className='h-72 overflow-hidden rounded-xl border sm:h-96 xl:h-[520px]'>
          <MapComponent position={location} onChange={(p) => handleSelect(p, "Pinned on map")} />
        </div>
        {location ? (
          <div className='flex items-start gap-2 text-sm'>
            <MapPin className='mt-0.5 size-4 shrink-0 text-primary' />
            <div>
              <div className='font-medium'>
                {label}
                {city && <span className='font-normal text-muted-foreground'> · {city.name}</span>}
              </div>
              <div className='font-mono text-xs text-muted-foreground'>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            </div>
          </div>
        ) : (
          <p className='text-xs text-muted-foreground'>Search above, or click the map to drop a pin. Drag the pin to adjust.</p>
        )}
      </section>

      <section className='flex flex-col gap-3'>
        {location && !loading && !canDispatchIn(user, city?.id) && (
          <div className='flex items-start gap-2 rounded-xl border bg-card p-3 text-sm text-muted-foreground'>
            <Eye className='mt-0.5 size-4 shrink-0' />
            {!city
              ? "This location is outside Metro Manila."
              : user.dispatchCityId
                ? `View only: this location is in ${city.name}, outside your city. Dispatch is done by the ${city.name} office.`
                : `View only: dispatch for ${city.name} is done by the ${city.name} office.`}
          </div>
        )}
        {runningCard?.length > 0 && canDispatchIn(user, city?.id) && (
          <div className='flex flex-col gap-3 rounded-xl border border-primary/20 bg-accent p-3 sm:flex-row sm:items-center'>
            <Siren className='hidden size-5 shrink-0 text-primary sm:block' />
            <p className='flex-1 text-sm'>
              Dispatch sends one truck from each <b>{runningCard[0].alarmLevel}</b> station and marks it Responding.
            </p>
            <Button onClick={() => setDispatchForm({ locationLabel: label, notes: "" })} disabled={loading}>
              Dispatch {runningCard[0].alarmLevel}
            </Button>
          </div>
        )}
        <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
          <Card
            runningCard={runningCard}
            truckPicks={truckPicks}
            onPickTruck={canDispatchIn(user, city?.id) ? (stationId, truckId) => setTruckPicks((p) => ({ ...p, [stationId]: truckId })) : undefined}
          />
        </div>
      </section>

      <Dialog open={!!dispatchForm} onOpenChange={(o) => !o && !busy && setDispatchForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch {runningCard?.[0]?.alarmLevel}</DialogTitle>
            <DialogDescription>Saves the incident and sends the trucks shown on the card.</DialogDescription>
          </DialogHeader>
          {dispatchForm && (
            <div className='grid gap-4'>
              <Field label='Location' hint='Add details like a house number or building name'>
                <Input value={dispatchForm.locationLabel} onChange={(e) => setDispatchForm({ ...dispatchForm, locationLabel: e.target.value })} />
              </Field>
              <Field label='Notes (optional)'>
                <Textarea rows={3} value={dispatchForm.notes} onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })} />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setDispatchForm(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={dispatch} disabled={busy}>
              {busy && <LoaderCircle className='animate-spin' />} Dispatch now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Home;
