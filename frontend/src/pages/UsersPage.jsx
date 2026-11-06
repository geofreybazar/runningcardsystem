import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import DeleteIcon from "@mui/icons-material/Delete";
import { api } from "../api/client.js";
import { ROLE_LABELS, useAuth } from "../auth/AuthContext.jsx";

// Mirrors the backend rule: admins manage field accounts only.
const manageableRoles = (role) =>
  role === "SUPER_ADMIN" ? Object.keys(ROLE_LABELS) : ["OPERATIONS", "RADIO_OPERATOR"];

const EMPTY = { username: "", fullName: "", role: "RADIO_OPERATOR", districtId: "" };

function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // null = closed; { id? ...fields }
  const [formError, setFormError] = useState("");
  const [password, setPassword] = useState(null); // { username, temporaryPassword }
  const [confirmRemove, setConfirmRemove] = useState(null);
  const roles = manageableRoles(me.role);

  const load = useCallback(() => api("/users").then(setUsers).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    api("/districts").then(setDistricts).catch(() => {});
  }, [load]);

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const save = async () => {
    setFormError("");
    const body = {
      fullName: form.fullName.trim(),
      role: form.role,
      ...(form.role === "OPERATIONS" ? { districtId: Number(form.districtId) } : form.id ? { districtId: null } : {}),
    };
    try {
      if (form.id) {
        await api(`/users/${form.id}`, { method: "PATCH", body });
      } else {
        const res = await api("/users", { method: "POST", body: { ...body, username: form.username.trim() } });
        setPassword({ username: res.user.username, temporaryPassword: res.temporaryPassword });
      }
      setForm(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    }
  };

  const resetPassword = (u) =>
    run(async () => {
      const res = await api(`/users/${u.id}/reset-password`, { method: "POST" });
      setPassword({ username: u.username, temporaryPassword: res.temporaryPassword });
    });

  return (
    <div className='flex flex-col gap-4 p-4 lg:p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Users</h1>
        <Button variant='contained' onClick={() => setForm(EMPTY)}>
          Add user
        </Button>
      </div>
      {error && <Alert severity='error' onClose={() => setError("")}>{error}</Alert>}

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>District</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const editable = roles.includes(u.role) && u.id !== me.id;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    {u.username}
                    {u.mustChangePassword && <Chip size='small' label='temp password' className='ml-2' />}
                  </TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                  <TableCell>{u.district?.name ?? "All NCR"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={u.isActive}
                      disabled={!editable}
                      onChange={(e) => run(() => api(`/users/${u.id}`, { method: "PATCH", body: { isActive: e.target.checked } }))}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    {editable && (
                      <>
                        <Tooltip title='Edit'>
                          <IconButton onClick={() => setForm({ ...u, districtId: u.districtId ?? "" })}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Reset password'>
                          <IconButton onClick={() => resetPassword(u)}>
                            <LockResetIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Remove'>
                          <IconButton color='error' onClick={() => setConfirmRemove(u)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!form} onClose={() => setForm(null)} fullWidth maxWidth='xs'>
        <DialogTitle>{form?.id ? "Edit user" : "Add user"}</DialogTitle>
        {form && (
          <DialogContent className='flex flex-col gap-4' sx={{ pt: "8px !important" }}>
            {formError && <Alert severity='error'>{formError}</Alert>}
            <TextField
              label='Username'
              value={form.username}
              disabled={!!form.id}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              helperText={form.id ? "" : "Letters, numbers, . _ -"}
            />
            <TextField label='Full name' value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <TextField select label='Role' value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </MenuItem>
              ))}
            </TextField>
            {form.role === "OPERATIONS" && (
              <TextField
                select
                label='Fire district'
                value={form.districtId}
                onChange={(e) => setForm({ ...form, districtId: e.target.value })}
                helperText='Operations users can only edit stations in this district'
              >
                {districts.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                    {d.alias ? ` (${d.alias})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>Cancel</Button>
          <Button variant='contained' onClick={save}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!password} onClose={() => setPassword(null)}>
        <DialogTitle>Temporary password</DialogTitle>
        <DialogContent>
          <p className='mb-3'>
            Give this to <b>{password?.username}</b>. It is shown only once; they must change it when they sign in.
          </p>
          <div className='rounded bg-gray-100 p-3 text-center font-mono text-lg'>{password?.temporaryPassword}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigator.clipboard?.writeText(password.temporaryPassword)}>Copy</Button>
          <Button variant='contained' onClick={() => setPassword(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmRemove} onClose={() => setConfirmRemove(null)}>
        <DialogTitle>Remove {confirmRemove?.username}?</DialogTitle>
        <DialogContent>They will be signed out and can no longer sign in. Their name stays on past incidents.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemove(null)}>Cancel</Button>
          <Button
            color='error'
            variant='contained'
            onClick={() => {
              const u = confirmRemove;
              setConfirmRemove(null);
              run(() => api(`/users/${u.id}`, { method: "DELETE" }));
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default UsersPage;
