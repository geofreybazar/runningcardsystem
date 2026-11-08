import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/** The signed-in user and the login / logout / change-password actions. */
const useAuth = () => useContext(AuthContext);

export default useAuth;
