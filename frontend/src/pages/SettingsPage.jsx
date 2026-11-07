import { useEffect, useState } from "react";
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
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false); // after the first Save attempt, errors follow the form as it is edited
  const errors = tried && form ? formErrors(settingsSchema, toBody(form)) : null;

  useEffect(() => {
    api("/settings")
      .then((s) => setForm(toForm(s)))
      .catch((e) => toast.error(e.message));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setTried(true);
    const body = toBody(form);
    if (formErrors(settingsSchema, body)) return; // shown under the fields
    try {
      const saved = await api("/settings", { method: "PUT", body });
      setForm(toForm(saved));
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
          {!form ? (
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
                  <Input type='number' min={1} max={20} value={form.stationsPerAlarm} onChange={(e) => setForm({ ...form, stationsPerAlarm: e.target.value })} />
                </Field>
                <Field label='Max distance (km)' hint='Stations farther than this never appear' error={errors?.maxDistanceKm}>
                  <Input type='number' min={1} max={200} value={form.maxDistanceKm} onChange={(e) => setForm({ ...form, maxDistanceKm: e.target.value })} />
                </Field>
              </div>
              <Field label='Alarm levels, in order' hint='One per line. Each level gets the next group of nearest stations.' error={errors?.alarmLevels}>
                <Textarea rows={10} className='font-mono text-sm' value={form.alarmLevels} onChange={(e) => setForm({ ...form, alarmLevels: e.target.value })} />
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
