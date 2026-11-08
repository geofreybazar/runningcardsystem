import { useEffect, useState } from "react";
import { AuthContext } from "@/hooks/auth/useAuth.js";
import { refreshSession, setAccessToken, setSignedOutHandler } from "@/service/client.js";
import authService from "@/service/auth.service.js";
import { queryClient } from "@/service/queryClient.js";


function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Cached data belongs to the account that loaded it: the next one to sign in starts empty.
  const signOut = () => {
    setAccessToken(null);
    queryClient.clear();
    setUser(null);
  };

  const start = (data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  useEffect(() => {
    setSignedOutHandler(signOut);
    // Restore the session after a page reload from the refresh cookie.
    refreshSession()
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const value = {
    user,
    ready,
    login: (accountNumber, password) => authService.login(accountNumber, password).then(start),
    changePassword: (currentPassword, newPassword) => authService.changePassword(currentPassword, newPassword).then(start),
    logout: async () => {
      await authService.logout().catch(() => {});
      signOut();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
