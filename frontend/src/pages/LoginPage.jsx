import AuthShell from "@/components/features/auth/AuthShell.jsx";
import LoginForm from "@/components/features/auth/LoginForm.jsx";

function LoginPage() {
  return (
    <AuthShell title='Sign in'>
      <LoginForm />
    </AuthShell>
  );
}

export default LoginPage;
