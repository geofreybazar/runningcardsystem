import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/Field.jsx";
import AuthShell from "@/components/AuthShell.jsx";
import { useAuth } from "@/auth/AuthContext.jsx";

function LoginPage() {
  const { login } = useAuth();
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(accountNumber.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell title='Sign in' description='Use the account given to you by your administrator.'>
      <form onSubmit={submit} className='grid gap-4'>
        {error && (
          <Alert variant='destructive'>
            <TriangleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Field label='Account number'>
          <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} autoComplete='username' autoCapitalize='characters' spellCheck={false} placeholder='e.g. B13084' autoFocus required />
        </Field>
        <Field label='Password'>
          <Input type='password' value={password} onChange={(e) => setPassword(e.target.value)} autoComplete='current-password' required />
        </Field>
        <Button type='submit' size='lg' disabled={busy}>
          {busy && <LoaderCircle className='animate-spin' />} Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
