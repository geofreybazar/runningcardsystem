import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, TriangleAlert, UserRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/Field.jsx";
import AuthShell from "@/components/AuthShell.jsx";
import { useAuth } from "@/auth/AuthContext.jsx";

/** Pill input with a leading icon and an optional trailing control; Field passes the id through to the input. */
function IconInput({ icon: Icon, end, className, ...props }) {
  return (
    <div className='relative'>
      <Icon className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground' aria-hidden='true' />
      <Input className={`h-11 rounded-full pl-11 ${end ? "pr-11" : ""} ${className ?? ""}`} {...props} />
      {end}
    </div>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <AuthShell title='Sign in'>
      <form onSubmit={submit} className='grid gap-4'>
        {error && (
          <Alert variant='destructive'>
            <TriangleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Field label='Account number'>
          <IconInput
            icon={UserRound}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            autoComplete='username'
            autoCapitalize='characters'
            spellCheck={false}
            placeholder='e.g. B13084'
            autoFocus
            required
          />
        </Field>
        <Field label='Password'>
          <IconInput
            icon={LockKeyhole}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete='current-password'
            required
            end={
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                className='absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
              </button>
            }
          />
        </Field>
        <Button type='submit' size='lg' className='mt-2 h-11 rounded-full' disabled={busy}>
          {busy && <LoaderCircle className='animate-spin' />} Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
