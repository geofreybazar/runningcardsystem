import { useState } from "react";
import { Alert, Button, Paper, TextField } from "@mui/material";
import { useAuth } from "../auth/AuthContext.jsx";

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 p-4'>
      <Paper className='w-full max-w-sm p-8' elevation={3}>
        <div className='mb-1 text-center text-2xl font-semibold text-red-700'>BFP-NCR</div>
        <div className='mb-6 text-center text-gray-600'>Running Card System</div>
        <form onSubmit={submit} className='flex flex-col gap-4'>
          {error && <Alert severity='error'>{error}</Alert>}
          <TextField label='Username' value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          <TextField label='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type='submit' variant='contained' color='error' size='large' disabled={busy}>
            Sign in
          </Button>
        </form>
      </Paper>
    </div>
  );
}

export default LoginPage;
