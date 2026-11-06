import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Button, Menu, MenuItem } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { ROLE_LABELS, useAuth } from "../auth/AuthContext.jsx";

/** Pages and the roles that see them in the menu. The backend enforces the same rules. */
export const NAV = [
  { to: "/", label: "Running Card", roles: ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "RADIO_OPERATOR"] },
  { to: "/incidents", label: "Incidents", roles: ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "RADIO_OPERATOR"] },
  { to: "/stations", label: "Stations & Trucks", roles: ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "RADIO_OPERATOR"] },
  { to: "/users", label: "Users", roles: ["SUPER_ADMIN", "ADMIN"] },
];

function Layout() {
  const { user, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='flex flex-wrap items-center gap-x-6 gap-y-2 bg-red-700 px-4 py-3 text-white lg:px-6'>
        <div className='text-xl font-semibold'>BFP-NCR Running Card System</div>
        <nav className='flex flex-1 flex-wrap gap-1'>
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) => `rounded px-3 py-1 text-sm ${isActive ? "bg-white/20 font-semibold" : "hover:bg-white/10"}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <Button color='inherit' startIcon={<AccountCircleIcon />} onClick={(e) => setAnchor(e.currentTarget)} sx={{ textTransform: "none" }}>
          {user.fullName} · {ROLE_LABELS[user.role]}
        </Button>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          <MenuItem component={NavLink} to='/change-password' onClick={() => setAnchor(null)}>
            Change password
          </MenuItem>
          <MenuItem onClick={logout}>Sign out</MenuItem>
        </Menu>
      </header>
      <Outlet />
    </div>
  );
}

export default Layout;
