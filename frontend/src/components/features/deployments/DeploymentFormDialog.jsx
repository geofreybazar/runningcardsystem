import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/common/Field.jsx";
import SubmitButton from "@/components/common/SubmitButton.jsx";
import MapComponent from "@/components/common/MapComponent.jsx";
import PlaceSearch from "@/components/features/runningCard/locationSearch/PlaceSearch.jsx";
import useCreateDeployment from "@/hooks/deployments/useCreateDeployment.js";
import useEditDeployment from "@/hooks/deployments/useEditDeployment.js";
import { formErrors } from "@/utils/validation.js";
import { deploymentBody } from "@/utils/deploymentForm.js";
import { deploymentFormSchema } from "@shared/validation";

/** New (initial without id) or edit a special deployment. `initial` null = closed; onSaved gets the saved deployment. */
function DeploymentFormDialog({ initial, onClose, onSaved }) {
  const { mutateAsync: createDeployment, isPending: adding } = useCreateDeployment();
  const { mutateAsync: editDeployment, isPending: editing } = useEditDeployment();
  const saving = adding || editing; // includes reloading the list after
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

  const errors = tried && form ? formErrors(deploymentFormSchema, deploymentBody(form)) : null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  // A searched place fills the pin, and the label when it is still empty.
  const pickPlace = (point, label) => setForm((f) => ({ ...f, lat: point.lat, lng: point.lng, locationLabel: f.locationLabel || label }));

  const save = async () => {
    setFormError("");
    setTried(true);
    const body = deploymentBody(form);
    if (formErrors(deploymentFormSchema, body)) return; // shown under the fields
    try {
      const saved = form.id ? await editDeployment({ id: form.id, ...body }) : await createDeployment(body);
      onClose();
      onSaved?.(saved);
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <Dialog open={!!initial} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className='max-h-[95svh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{form?.id ? "Edit deployment" : "New special deployment"}</DialogTitle>
          {!form?.id && <DialogDescription>For planned events such as ASEAN or SONA. You add the trucks next.</DialogDescription>}
        </DialogHeader>
        {form && (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='grid content-start gap-4'>
              {formError && (
                <Alert variant='destructive'>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <Field label='Event' hint='e.g. SONA 2026' error={errors?.name}>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label='Location' error={errors?.locationLabel}>
                <Input value={form.locationLabel} onChange={(e) => set({ locationLabel: e.target.value })} placeholder='e.g. Batasang Pambansa, Quezon City' />
              </Field>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <Field label='Starts' error={errors?.startsAt}>
                  <Input type='datetime-local' value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} />
                </Field>
                <Field label='Planned end' hint='Optional; trucks return only when released' error={errors?.endsAt}>
                  <Input type='datetime-local' value={form.endsAt} min={form.startsAt || undefined} onChange={(e) => set({ endsAt: e.target.value })} />
                </Field>
              </div>
              <Field label='Notes' hint='Optional' error={errors?.notes}>
                <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
              </Field>
            </div>
            <div className='grid content-start gap-2'>
              <PlaceSearch onSelect={pickPlace} onError={setFormError} />
              <div className='h-72 overflow-hidden rounded-lg border md:h-80'>
                <MapComponent
                  kind='deployment'
                  position={form.lat != null ? { lat: form.lat, lng: form.lng } : null}
                  onChange={(p) => set({ lat: p.lat, lng: p.lng })}
                />
              </div>
              <p className={`font-mono text-xs ${errors?.lat ? "text-destructive" : "text-muted-foreground"}`}>
                {form.lat != null ? `${form.lat.toFixed(6)}, ${form.lng.toFixed(6)}` : "Search, or click the map to place the deployment"}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <SubmitButton onClick={save} saving={saving}>
            Save
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeploymentFormDialog;
