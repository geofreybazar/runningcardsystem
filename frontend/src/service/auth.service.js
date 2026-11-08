import { api } from "./client.js";

const login = (accountNumber, password) => api("/auth/login", { method: "POST", body: { accountNumber, password } });
const changePassword = (currentPassword, newPassword) => api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
const logout = () => api("/auth/logout", { method: "POST" });

export default { login, changePassword, logout };
