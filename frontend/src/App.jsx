import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import { LoaderCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/components/Alarm.jsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import Layout, { NAV } from "./components/Layout.jsx";
import Home from "./components/Home.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import StationsPage from "./pages/StationsPage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import IncidentDetailPage from "./pages/IncidentDetailPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AuditLogPage from "./pages/AuditLogPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";

const PAGES = {
  "/": <Home />,
  "/incidents": <IncidentsPage />,
  "/notifications": <NotificationsPage />,
  "/stations": <StationsPage />,
  "/users": <UsersPage />,
  "/audit-log": <AuditLogPage />,
  "/settings": <SettingsPage />,
};

function ChangePasswordRoute() {
  const navigate = useNavigate();
  return <ChangePasswordPage onDone={() => navigate("/", { replace: true })} />;
}

function AppRoutes() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <LoaderCircle className='size-6 animate-spin text-primary' />
      </div>
    );
  }
  if (!user) return <LoginPage />;
  if (user.mustChangePassword) return <ChangePasswordPage />;

  const pages = NAV.filter((n) => n.roles.includes(user.role));
  return (
    <Routes>
      <Route element={<Layout />}>
        {pages.map((n) => (
          <Route key={n.to} path={n.to} element={PAGES[n.to]} />
        ))}
        <Route path='/incidents/:id' element={<IncidentDetailPage />} />
      </Route>
      <Route path='/change-password' element={<ChangePasswordRoute />} />
      {/* Home is the first page the role may see (the running card for dispatchers, else incidents). */}
      <Route path='*' element={<Navigate to={pages[0].to} replace />} />
    </Routes>
  );
}

function App() {
  const [theme] = useTheme();
  return (
    <BrowserRouter>
      <AuthProvider>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_API}>
          <TooltipProvider>
            <AppRoutes />
            <Toaster richColors position='top-right' theme={theme} />
          </TooltipProvider>
        </APIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
