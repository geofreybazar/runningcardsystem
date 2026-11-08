import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/common/Field.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import { passwordErrors } from "@/utils/passwordErrors.js";

/** Current + new password (twice). onDone: after success or Cancel; without it the button signs out instead. */
function ChangePasswordForm({ onDone }) {
  const { changePassword, logout } = useAuth();
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
  );
}

export default ChangePasswordForm;
