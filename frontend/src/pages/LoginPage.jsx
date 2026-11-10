import { Link } from "react-router-dom";
import AuthShell from "@/components/features/auth/AuthShell.jsx";
import LoginForm from "@/components/features/auth/LoginForm.jsx";

function LoginPage() {
  return (
    <AuthShell title='Sign in'>
      <LoginForm />
      <Link to='/about' className='mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'>
        About this system
      </Link>
    </AuthShell>
  );
}

export default LoginPage;
