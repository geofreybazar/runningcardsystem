import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/common/Field.jsx";
import SubmitButton from "@/components/common/SubmitButton.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import useAddTruck from "@/hooks/stations/useAddTruck.js";
import useEditTruck from "@/hooks/stations/useEditTruck.js";
import { OWNERSHIP, toOptions } from "@/constants/truck.js";
import { formErrors } from "@/utils/validation.js";
import { truckBody, truckTypeOptions } from "@/utils/stationForm.js";
import { createTruckSchema } from "@shared/validation";

/** Add a truck to `stationId` (initial without id) or edit one. `initial` null = closed. */
function TruckFormDialog({ initial, stationId, onClose }) {
  const { mutateAsync: addTruck, isPending: adding } = useAddTruck();
  const { mutateAsync: editTruck, isPending: editing } = useEditTruck();
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

  const errors = tried && form ? formErrors(createTruckSchema, truckBody(form)) : null;

  const save = async () => {
    setFormError("");
    setTried(true);
    const body = truckBody(form);
    if (formErrors(createTruckSchema, body)) return; // shown under the fields
    try {
      if (form.id) await editTruck({ id: form.id, ...body });
      else await addTruck({ stationId, ...body });
      onClose();
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <Dialog open={!!initial} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{form?.id ? "Edit truck" : "Add truck"}</DialogTitle>
        </DialogHeader>
        {form && (
          <div className='grid gap-4'>
            {formError && (
              <Alert variant='destructive'>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Field label='Call sign' error={errors?.callSign}>
              <Input value={form.callSign} onChange={(e) => setForm({ ...form, callSign: e.target.value })} />
            </Field>
            <div className='grid grid-cols-2 gap-4'>
              <Field label='Type' error={errors?.type}>
                <SimpleSelect value={form.type} onChange={(type) => setForm({ ...form, type })} options={truckTypeOptions()} />
              </Field>
              <Field label='Owner' error={errors?.ownership}>
                <SimpleSelect value={form.ownership} onChange={(ownership) => setForm({ ...form, ownership })} options={toOptions(OWNERSHIP)} />
              </Field>
              <Field label='Plate number' error={errors?.plateNumber}>
                <Input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
              </Field>
              <Field label='Water (liters)' error={errors?.waterCapacityLiters}>
                <Input type='number' min={0} value={form.waterCapacityLiters} onChange={(e) => setForm({ ...form, waterCapacityLiters: e.target.value })} />
              </Field>
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

export default TruckFormDialog;
