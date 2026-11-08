import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import Field from "@/components/common/Field.jsx";
import SubmitButton from "@/components/common/SubmitButton.jsx";
import useGetSettings from "@/hooks/settings/useGetSettings.js";
import { formErrors } from "@/utils/validation.js";
import { settingsSchema } from "@shared/validation";
import useEditSettings from "@/hooks/settings/useEditSettings.js";
import { toBody, toForm } from "@/utils/settingsForm.js";

/** The running card rules form; shows the saved values until the first edit. */
function SettingsForm() {
  const { mutateAsync: editSettings, isPending: saving } = useEditSettings();
  const settings = useGetSettings();
  const [edits, setEdits] = useState(null); // null until the first change: the form shows the saved settings
  const form = edits ?? (settings.data && toForm(settings.data));
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false); // after the first Save attempt, errors follow the form as it is edited
  const errors = tried && form ? formErrors(settingsSchema, toBody(form)) : null;

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setTried(true);
    const body = toBody(form);
    if (formErrors(settingsSchema, body)) return; // shown under the fields
    try {
      await editSettings(body);
      setEdits(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {settings.isError ? (
        <p className='text-sm text-destructive'>Could not load the settings. Reload the page to try again.</p>
      ) : !form ? (
        <Skeleton className='h-64 w-full' />
      ) : (
        <form onSubmit={save} className='grid gap-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Stations per alarm level' error={errors?.stationsPerAlarm}>
              <Input type='number' min={1} max={20} value={form.stationsPerAlarm} onChange={(e) => setEdits({ ...form, stationsPerAlarm: e.target.value })} />
            </Field>
            <Field label='Max distance (km)' hint='Stations farther than this never appear' error={errors?.maxDistanceKm}>
              <Input type='number' min={1} max={200} value={form.maxDistanceKm} onChange={(e) => setEdits({ ...form, maxDistanceKm: e.target.value })} />
            </Field>
          </div>
          <Field label='Alarm levels, in order' hint='One per line. Each level gets the next group of nearest stations.' error={errors?.alarmLevels}>
            <Textarea rows={10} className='font-mono text-sm' value={form.alarmLevels} onChange={(e) => setEdits({ ...form, alarmLevels: e.target.value })} />
          </Field>
          <SubmitButton type='submit' className='w-fit' saving={saving}>
            Save rules
          </SubmitButton>
        </form>
      )}
    </>
  );
}

export default SettingsForm;
