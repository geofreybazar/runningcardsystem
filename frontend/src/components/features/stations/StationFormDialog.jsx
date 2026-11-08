import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/common/Field.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import MapComponent from "@/components/common/MapComponent.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useAddStation from "@/hooks/stations/useAddStation.js";
import useEditStation from "@/hooks/stations/useEditStation.js";
import { canEditCity } from "@/utils/permissions.js";
import { formErrors } from "@/utils/validation.js";
import { stationBody } from "@/utils/stationForm.js";
import { createStationSchema } from "@shared/validation";

/** Add (initial without id) or edit a station, placed on the map. `initial` null = closed; onSaved gets the saved station. */
function StationFormDialog({ initial, district, editableCities, onClose, onSaved }) {
  const { user } = useAuth();
  const { mutateAsync: addStation } = useAddStation();
  const { mutateAsync: editStation } = useEditStation();
  const [form, setForm] = useState(initial);
  const [formError, setFormError] = useState("");
  const [tried, setTried] = useState(false); // after the first Save attempt, errors follow the form as it is edited
  // A newly opened dialog starts from its own values.
  const [shown, setShown] = useState(initial);
  if (initial !== shown) {
    setShown(initial);
    setForm(initial);
    setFormError("");
    setTried(false);
  }

  const errors = tried && form ? formErrors(createStationSchema, stationBody(form)) : null;

  const save = async () => {
    setFormError("");
    setTried(true);
    const body = stationBody(form);
    if (formErrors(createStationSchema, body)) return; // shown under the fields
    try {
      const saved = form.id ? await editStation({ id: form.id, ...body }) : await addStation(body);
      onClose();
      onSaved(saved);
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <Dialog open={!!initial} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-h-[95svh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{form?.id ? "Edit station" : `Add station to ${district?.name}`}</DialogTitle>
        </DialogHeader>
        {form && (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='grid content-start gap-4'>
              {formError && (
                <Alert variant='destructive'>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <Field label='Station name' error={errors?.name}>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label='City' error={errors?.cityId}>
                <SimpleSelect
                  value={form.cityId}
                  onChange={(cityId) => setForm({ ...form, cityId })}
                  options={(form.id ? (district?.cities ?? []) : editableCities)
                    .filter((c) => canEditCity(user, c.id))
                    .map((c) => ({ value: c.id, label: c.name }))}
                />
              </Field>
              <Field label='Address' error={errors?.address}>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <Field label='Contact number' error={errors?.contactNumber}>
                <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
              </Field>
              <p className={`font-mono text-xs ${errors?.lat ? "text-destructive" : "text-muted-foreground"}`}>
                {form.lat ? `${form.lat.toFixed(6)}, ${form.lng.toFixed(6)}` : "Click the map to place the station"}
              </p>
            </div>
            <div className='h-72 overflow-hidden rounded-lg border md:h-full md:min-h-80'>
              <MapComponent
                kind='station'
                position={form.lat ? { lat: form.lat, lng: form.lng } : null}
                onChange={(p) => setForm((f) => ({ ...f, lat: p.lat, lng: p.lng }))}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StationFormDialog;
