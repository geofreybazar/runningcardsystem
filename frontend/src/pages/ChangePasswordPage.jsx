import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/Field.jsx";
import AuthShell from "@/components/AuthShell.jsx";
import { useAuth } from "@/auth/AuthContext.jsx";
import { formErrors } from "@/lib/validation.js";
import { changePasswordSchema } from "@shared/validation";

/** The shared rules for the new password, plus the confirmation (a form-only field). */
function passwordErrors(currentPassword, newPassword, confirm) {
  const errors = { ...formErrors(changePasswordSchema, { currentPassword, newPassword }) };
  if (confirm !== newPassword) errors.confirm = "The new passwords don't match";
  return Object.keys(errors).length ? errors : null;
}

function ChangePasswordPage({ onDone }) {
  const { user, changePassword, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false); // after the first attempt, errors follow the form as it is edited
  const errors = tried ? passwordErrors(current, next, confirm) : null;

  const submit = async (e) => {
    e.preventDefault();
    setTried(true);
    if (passwordErrors(current, next, confirm)) return; // shown under the fields
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
        <Field label='New password' hint='At least 8 characters' error={errors?.newPassword}>
          <Input type='password' value={next} onChange={(e) => setNext(e.target.value)} autoComplete='new-password' required />
        </Field>
        <Field label='Confirm new password' error={errors?.confirm}>
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
