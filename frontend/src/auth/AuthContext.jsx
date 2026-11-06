import { createContext, useContext, useEffect, useState } from "react";
import { api, refreshSession, setAccessToken, setSignedOutHandler } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const start = (data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  useEffect(() => {
    setSignedOutHandler(() => setUser(null));
    // Restore the session after a page reload from the refresh cookie.
    refreshSession()
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const value = {
    user,
    ready,
    login: (username, password) => api("/auth/login", { method: "POST", body: { username, password } }).then(start),
    changePassword: (currentPassword, newPassword) =>
      api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }).then(start),
    logout: async () => {
      await api("/auth/logout", { method: "POST" }).catch(() => {});
      setAccessToken(null);
      setUser(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPERATIONS: "Operations",
  RADIO_OPERATOR: "Radio Operator",
};
