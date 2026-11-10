import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/common/Field.jsx";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import useCreateIncident from "@/hooks/incidents/useCreateIncident.js";

/**
 * Confirms a dispatch: the location label and notes can be edited. `initial` ({ locationLabel, notes }) null = closed.
 * On success it opens the new incident; on failure it closes (the error is a toast).
 */
function DispatchDialog({ initial, alarmLevel, stations = [], location, label, barangayId, truckPicks, onClose }) {
  const navigate = useNavigate();
  const { mutate: createIncident, isPending: busy } = useCreateIncident();
  const [form, setForm] = useState(initial);
  const [shown, setShown] = useState(initial);
  if (initial !== shown) {
    setShown(initial);
    setForm(initial);
  }

  const dispatch = () =>
    createIncident(
      {
        ...location,
        locationLabel: form.locationLabel.trim() || label,
        notes: form.notes.trim() || undefined,
        barangayId: barangayId ?? undefined,
        truckPicks,
      },
      { onSuccess: (incident) => navigate(`/incidents/${incident.id}`), onError: onClose },
    );

  return (
    <Dialog open={!!initial} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispatch {alarmLevel}</DialogTitle>
          <DialogDescription>Saves the incident and sends these trucks now. They are marked Responding.</DialogDescription>
        </DialogHeader>
        {form && (
          <div className='grid gap-4'>
            <div className='rounded-md border'>
              <div className='flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5'>
                <AlarmBadge level={alarmLevel} index={0} />
                <span className='text-xs text-muted-foreground'>
                  {stations.length} truck{stations.length === 1 ? "" : "s"}
                  {location && <span className='ml-2 font-data text-sm'>{`${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}</span>}
                </span>
              </div>
              <ul className='max-h-40 divide-y overflow-y-auto text-sm'>
                {stations.map((s) => {
                  const truck = s.trucks.find((t) => t.id === truckPicks?.[s.id]) ?? s.trucks[0];
                  return (
                    <li key={s.id} className='flex items-center justify-between gap-3 px-3 py-1.5'>
                      <span className='truncate'>{s.name}</span>
                      <span className='shrink-0 font-data'>{truck?.callSign}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Field label='Location' hint='Add details like a house number or building name'>
              <Input value={form.locationLabel} onChange={(e) => setForm({ ...form, locationLabel: e.target.value })} />
            </Field>
            <Field label='Notes (optional)'>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={dispatch} disabled={busy} className='min-w-36 font-semibold'>
            {busy && <LoaderCircle className='animate-spin' />} Dispatch now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DispatchDialog;
