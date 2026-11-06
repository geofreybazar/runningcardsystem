import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { APIProvider } from "@vis.gl/react-google-maps";
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

const PAGES = {
  "/": <Home />,
  "/incidents": <IncidentsPage />,
  "/stations": <StationsPage />,
  "/users": <UsersPage />,
  "/audit-log": <AuditLogPage />,
  "/settings": <SettingsPage />,
};

function ChangePasswordRoute() {
  const navigate = useNavigate();
  return <ChangePasswordPage onDone={() => navigate("/")} />;
}

function AppRoutes() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <CircularProgress />
      </div>
    );
  }
  if (!user) return <LoginPage />;
  if (user.mustChangePassword) return <ChangePasswordPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
          <Route key={n.to} path={n.to} element={PAGES[n.to]} />
        ))}
        <Route path='/incidents/:id' element={<IncidentDetailPage />} />
      </Route>
      <Route path='/change-password' element={<ChangePasswordRoute />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_API}>
          <AppRoutes />
        </APIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
