import { useEffect, useState } from "react";
import { Alert, Button, Paper, TextField } from "@mui/material";
import { api } from "../api/client.js";

function SettingsPage() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState(null); // { severity, text }

  useEffect(() => {
    api("/settings")
      .then((s) => setForm({ ...s, alarmLevels: s.alarmLevels.join("\n") }))
      .catch((e) => setMessage({ severity: "error", text: e.message }));
  }, []);

  const save = async () => {
    setMessage(null);
    try {
      const saved = await api("/settings", {
        method: "PUT",
        body: {
          stationsPerAlarm: Number(form.stationsPerAlarm),
          maxDistanceKm: Number(form.maxDistanceKm),
          alarmLevels: form.alarmLevels.split("\n").map((l) => l.trim()).filter(Boolean),
        },
      });
      setForm({ ...saved, alarmLevels: saved.alarmLevels.join("\n") });
      setMessage({ severity: "success", text: "Saved. New running cards use these rules." });
    } catch (e) {
      setMessage({ severity: "error", text: e.message });
    }
  };

  if (!form) return <div className='p-6'>{message ? <Alert severity={message.severity}>{message.text}</Alert> : "Loading…"}</div>;

  return (
    <div className='flex max-w-xl flex-col gap-4 p-4 lg:p-6'>
      <h1 className='text-xl font-semibold'>Running card rules</h1>
      {message && <Alert severity={message.severity}>{message.text}</Alert>}
      <Paper variant='outlined' className='flex flex-col gap-4 p-4'>
        <TextField
          label='Stations per alarm level'
          type='number'
          value={form.stationsPerAlarm}
          onChange={(e) => setForm({ ...form, stationsPerAlarm: e.target.value })}
          slotProps={{ htmlInput: { min: 1, max: 20 } }}
        />
        <TextField
          label='Max distance (km)'
          type='number'
          value={form.maxDistanceKm}
          onChange={(e) => setForm({ ...form, maxDistanceKm: e.target.value })}
          helperText='Stations farther than this are never on the card'
        />
        <TextField
          label='Alarm levels, in order'
          multiline
          minRows={6}
          value={form.alarmLevels}
          onChange={(e) => setForm({ ...form, alarmLevels: e.target.value })}
          helperText='One per line. Each level gets the next group of nearest stations.'
        />
        <Button variant='contained' onClick={save} className='self-start'>
          Save
        </Button>
      </Paper>
    </div>
  );
}

export default SettingsPage;
