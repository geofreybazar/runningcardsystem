import AuthShell from "@/components/features/auth/AuthShell.jsx";
import ChangePasswordForm from "@/components/features/auth/ChangePasswordForm.jsx";
import useAuth from "@/hooks/auth/useAuth.js";

function ChangePasswordPage({ onDone }) {
  const { user } = useAuth();
  return (
    <AuthShell
      title='Change your password'
      description={user?.mustChangePassword ? "You signed in with a temporary password. Choose your own to continue." : undefined}
    >
      <ChangePasswordForm onDone={onDone} />
    </AuthShell>
  );
}

export default ChangePasswordPage;
