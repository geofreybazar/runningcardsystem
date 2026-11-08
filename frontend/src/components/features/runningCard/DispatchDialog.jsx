import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/common/Field.jsx";
import useCreateIncident from "@/hooks/incidents/useCreateIncident.js";

/**
 * Confirms a dispatch: the location label and notes can be edited. `initial` ({ locationLabel, notes }) null = closed.
 * On success it opens the new incident; on failure it closes (the error is a toast).
 */
function DispatchDialog({ initial, alarmLevel, location, label, barangayId, truckPicks, onClose }) {
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
          <DialogDescription>Saves the incident and sends the trucks shown on the card.</DialogDescription>
        </DialogHeader>
        {form && (
          <div className='grid gap-4'>
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
          <Button onClick={dispatch} disabled={busy}>
            {busy && <LoaderCircle className='animate-spin' />} Dispatch now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DispatchDialog;
