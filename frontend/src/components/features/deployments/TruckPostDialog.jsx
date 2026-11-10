import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/common/Field.jsx";
import MapComponent from "@/components/common/MapComponent.jsx";
import PlaceSearch from "@/components/features/runningCard/locationSearch/PlaceSearch.jsx";
import useSetTruckPost from "@/hooks/deployments/useSetTruckPost.js";
import { formErrors } from "@/utils/validation.js";
import { unitPosition } from "@/utils/deploymentMap.js";
import { truckPostSchema } from "@shared/validation";

/** Where one deployed truck stands, e.g. Engine A at Quiapo Church. `unit` null = closed. Starts from its current post. */
function TruckPostDialog({ deployment, unit, onClose }) {
  const { mutateAsync: setPost, isPending: saving } = useSetTruckPost();
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [tried, setTried] = useState(false);
  // A newly opened dialog starts from this truck's post (or the event location).
  const [shown, setShown] = useState(null);
  if (unit !== shown) {
    setShown(unit);
    setForm(unit && { postLabel: unit.postLabel ?? "", ...unitPosition(unit, deployment) });
    setFormError("");
    setTried(false);
  }

  const errors = tried && form ? formErrors(truckPostSchema, { ...form, postLabel: form.postLabel.trim() }) : null;
  // A searched place moves the pin, and names the post when it has no name yet.
  const pickPlace = (point, label) => setForm((f) => ({ ...f, ...point, postLabel: f.postLabel || label }));

  const save = async () => {
    setFormError("");
    setTried(true);
    const body = { ...form, postLabel: form.postLabel.trim() };
    if (formErrors(truckPostSchema, body)) return; // shown under the fields
    try {
      await setPost({ id: deployment.id, truckId: unit.truck.id, ...body });
      onClose();
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <Dialog open={!!unit} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className='max-h-[95svh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Post for {unit?.truck.callSign}</DialogTitle>
          <DialogDescription>Where this truck stands during {deployment.name}. Search a place or click the map.</DialogDescription>
        </DialogHeader>
        {form && (
          <div className='grid gap-3'>
            {formError && (
              <Alert variant='destructive'>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Field label='Post' hint='e.g. Quiapo Church, corner Quezon Blvd' error={errors?.postLabel}>
              <Input value={form.postLabel} onChange={(e) => setForm({ ...form, postLabel: e.target.value })} />
            </Field>
            <PlaceSearch onSelect={pickPlace} onError={setFormError} />
            <div className='h-72 overflow-hidden rounded-lg border'>
              <MapComponent kind='post' position={{ lat: form.lat, lng: form.lng }} onChange={(p) => setForm({ ...form, lat: p.lat, lng: p.lng })} />
            </div>
            <p className='font-mono text-xs text-muted-foreground'>
              {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <LoaderCircle className='animate-spin' />} Save post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TruckPostDialog;
