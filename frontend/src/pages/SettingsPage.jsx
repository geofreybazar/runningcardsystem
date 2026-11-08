import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import Page from "@/components/Page.jsx";
import Field from "@/components/Field.jsx";
import { api } from "@/api/client.js";
import { useSettings } from "@/api/query.js";
import { formErrors } from "@/lib/validation.js";
import { settingsSchema } from "@shared/validation";

const toForm = (s) => ({ ...s, alarmLevels: s.alarmLevels.join("\n") });
const toBody = (f) => ({
  stationsPerAlarm: f.stationsPerAlarm === "" ? undefined : Number(f.stationsPerAlarm),
  maxDistanceKm: f.maxDistanceKm === "" ? undefined : Number(f.maxDistanceKm),
  alarmLevels: f.alarmLevels
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean),
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useSettings();
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
      const saved = await api("/settings", { method: "PUT", body });
      queryClient.setQueryData(["settings"], saved); // alarm badge colours follow too
      setEdits(null);
      toast.success("Saved. New running cards use these rules.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Page title='Settings'>
      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Running card rules</CardTitle>
          <CardDescription>Apply to every running card generated after you save.</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Button type='submit' className='w-fit'>
                Save rules
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}

export default SettingsPage;
