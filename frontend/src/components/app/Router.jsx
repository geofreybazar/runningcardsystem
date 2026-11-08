import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import useAuth from "@/hooks/auth/useAuth.js";
import { NAV } from "@/constants/links.js";
import Layout from "@/components/layout/Layout.jsx";
import HomePage from "@/pages/HomePage.jsx";
import LoginPage from "@/pages/LoginPage.jsx";
import ChangePasswordPage from "@/pages/ChangePasswordPage.jsx";
import UsersPage from "@/pages/UsersPage.jsx";
import StationsPage from "@/pages/StationsPage.jsx";
import IncidentsPage from "@/pages/IncidentsPage.jsx";
import IncidentDetailPage from "@/pages/IncidentDetailPage.jsx";
import SettingsPage from "@/pages/SettingsPage.jsx";
import AuditLogPage from "@/pages/AuditLogPage.jsx";
import NotificationsPage from "@/pages/NotificationsPage.jsx";
import StatisticsPage from "@/pages/StatisticsPage.jsx";
import DeploymentsPage from "@/pages/DeploymentsPage.jsx";
import DeploymentDetailPage from "@/pages/DeploymentDetailPage.jsx";

const PAGES = {
  "/": <HomePage />,
  "/incidents": <IncidentsPage />,
  "/notifications": <NotificationsPage />,
  "/statistics": <StatisticsPage />,
  "/stations": <StationsPage />,
  "/users": <UsersPage />,
  "/audit-log": <AuditLogPage />,
  "/settings": <SettingsPage />,
  "/deployments": <DeploymentsPage />,
};

function ChangePasswordRoute() {
  const navigate = useNavigate();
  return <ChangePasswordPage onDone={() => navigate("/", { replace: true })} />;
}

function Router() {
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
        <Route path='/deployments/:id' element={<DeploymentDetailPage />} />
      </Route>
      <Route path='/change-password' element={<ChangePasswordRoute />} />
      {/* Home is the first page the role may see (the running card for dispatchers, else incidents). */}
      <Route path='*' element={<Navigate to={pages[0].to} replace />} />
    </Routes>
  );
}

export default Router;
