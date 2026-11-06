import { useState } from "react";
import { Alert, Button, Paper, TextField } from "@mui/material";
import { useAuth } from "../auth/AuthContext.jsx";

function ChangePasswordPage({ onDone }) {
  const { user, changePassword, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    setError("");
    try {
      await changePassword(current, next);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 p-4'>
      <Paper className='w-full max-w-sm p-8' elevation={3}>
        <div className='mb-2 text-xl font-semibold'>Change your password</div>
        {user?.mustChangePassword && (
          <p className='mb-4 text-sm text-gray-600'>You signed in with a temporary password. Choose your own to continue.</p>
        )}
        <form onSubmit={submit} className='flex flex-col gap-4'>
          {error && <Alert severity='error'>{error}</Alert>}
          <TextField label='Current password' type='password' value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <TextField label='New password' type='password' value={next} onChange={(e) => setNext(e.target.value)} required helperText='At least 8 characters' />
          <TextField label='Confirm new password' type='password' value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type='submit' variant='contained' disabled={busy}>
            Save password
          </Button>
          <Button onClick={onDone ?? logout}>{onDone ? "Cancel" : "Sign out"}</Button>
        </form>
      </Paper>
    </div>
  );
}

export default ChangePasswordPage;
