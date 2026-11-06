import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/Field.jsx";
import AuthShell from "@/components/AuthShell.jsx";
import { useAuth } from "@/auth/AuthContext.jsx";

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
      toast.success("Password changed");
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title='Change your password'
      description={user?.mustChangePassword ? "You signed in with a temporary password. Choose your own to continue." : undefined}
    >
      <form onSubmit={submit} className='grid gap-4'>
        {error && (
          <Alert variant='destructive'>
            <TriangleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Field label='Current password'>
          <Input type='password' value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete='current-password' required />
        </Field>
        <Field label='New password' hint='At least 8 characters'>
          <Input type='password' value={next} onChange={(e) => setNext(e.target.value)} autoComplete='new-password' required />
        </Field>
        <Field label='Confirm new password'>
          <Input type='password' value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete='new-password' required />
        </Field>
        <Button type='submit' size='lg' disabled={busy}>
          {busy && <LoaderCircle className='animate-spin' />} Save password
        </Button>
        <Button type='button' variant='ghost' onClick={onDone ?? logout}>
          {onDone ? "Cancel" : "Sign out"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default ChangePasswordPage;
