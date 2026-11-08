import { api } from "./client.js";

const getUsers = () => api("/users");
/** Returns { user, temporaryPassword }. */
const addUser = (body) => api("/users", { method: "POST", body });
const editUser = ({ id, ...body }) => api(`/users/${id}`, { method: "PATCH", body });
const changeUserStatus = ({ id, isActive }) => api(`/users/${id}`, { method: "PATCH", body: { isActive } });
/** Returns { temporaryPassword }. */
const resetPassword = (id) => api(`/users/${id}/reset-password`, { method: "POST" });
const removeUser = (id) => api(`/users/${id}`, { method: "DELETE" });

export default { getUsers, addUser, editUser, changeUserStatus, resetPassword, removeUser };
