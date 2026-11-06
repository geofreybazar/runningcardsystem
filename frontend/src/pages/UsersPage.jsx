import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Page from "@/components/Page.jsx";
import Field from "@/components/Field.jsx";
import SimpleSelect from "@/components/SimpleSelect.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import { api } from "@/api/client.js";
import { ROLE_LABELS, useAuth } from "@/auth/AuthContext.jsx";

// Mirrors the backend rule: admins manage field accounts only.
const manageableRoles = (role) => (role === "SUPER_ADMIN" ? Object.keys(ROLE_LABELS) : ["OPERATIONS", "RADIO_OPERATOR"]);

const EMPTY = { username: "", fullName: "", role: "RADIO_OPERATOR", districtId: "" };

function Actions({ onEdit, onReset, onRemove }) {
  const item = (label, onClick, Icon, destructive) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='ghost' size='icon' className={`size-8 ${destructive ? "text-destructive hover:text-destructive" : ""}`} onClick={onClick} aria-label={label}>
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
  return (
    <div className='flex justify-end'>
      {item("Edit", onEdit, Pencil)}
      {item("Reset password", onReset, KeyRound)}
      {item("Remove", onRemove, Trash2, true)}
    </div>
  );
}

function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [password, setPassword] = useState(null); // { username, temporaryPassword }
  const [confirmRemove, setConfirmRemove] = useState(null);
  const roles = manageableRoles(me.role);

  const load = useCallback(() => api("/users").then(setUsers).catch((e) => toast.error(e.message)), []);
  useEffect(() => {
    load();
    api("/districts").then(setDistricts).catch(() => {});
  }, [load]);

  const run = async (fn, success) => {
    try {
      await fn();
      if (success) toast.success(success);
      await load();
    } catch (e) {
      toast.error(e.message);
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
        toast.success("User updated");
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

  const setActive = (u, isActive) => run(() => api(`/users/${u.id}`, { method: "PATCH", body: { isActive } }), `${u.username} ${isActive ? "enabled" : "disabled"}`);
  const edit = (u) => {
    setFormError("");
    setForm({ ...u, districtId: u.districtId ?? "" });
  };
  const editable = (u) => roles.includes(u.role) && u.id !== me.id;

  return (
    <Page
      title='Users'
      description='Create accounts, disable access, and reset passwords.'
      actions={
        <Button
          onClick={() => {
            setFormError("");
            setForm(EMPTY);
          }}
        >
          <Plus /> Add user
        </Button>
      }
    >
      {/* Phones: cards. Wider screens: a table. */}
      <div className='grid gap-2 md:hidden'>
        {users.map((u) => (
          <Card key={u.id} className='gap-2 px-4 py-3'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <div className='truncate font-medium'>{u.fullName}</div>
                <div className='text-xs text-muted-foreground'>
                  @{u.username} · {ROLE_LABELS[u.role]} · {u.district?.name ?? "All NCR"}
                </div>
              </div>
              <Switch checked={u.isActive} disabled={!editable(u)} onCheckedChange={(v) => setActive(u, v)} aria-label='Active' />
            </div>
            {u.mustChangePassword && <Badge variant='outline' className='w-fit'>Temporary password</Badge>}
            {editable(u) && <Actions onEdit={() => edit(u)} onReset={() => resetPassword(u)} onRemove={() => setConfirmRemove(u)} />}
          </Card>
        ))}
      </div>

      <Card className='hidden py-0 md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className='font-medium'>{u.fullName}</TableCell>
                <TableCell>
                  <span className='text-muted-foreground'>@{u.username}</span>
                  {u.mustChangePassword && (
                    <Badge variant='outline' className='ml-2'>
                      Temporary password
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                <TableCell>{u.district?.name ?? <span className='text-muted-foreground'>All NCR</span>}</TableCell>
                <TableCell>
                  <Switch checked={u.isActive} disabled={!editable(u)} onCheckedChange={(v) => setActive(u, v)} aria-label='Active' />
                </TableCell>
                <TableCell>{editable(u) && <Actions onEdit={() => edit(u)} onReset={() => resetPassword(u)} onRemove={() => setConfirmRemove(u)} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit user" : "Add user"}</DialogTitle>
            {!form?.id && <DialogDescription>A temporary password is generated; they choose their own at first sign-in.</DialogDescription>}
          </DialogHeader>
          {form && (
            <div className='grid gap-4'>
              {formError && (
                <Alert variant='destructive'>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <Field label='Username' hint={form.id ? undefined : "Letters, numbers, . _ -"}>
                <Input value={form.username} disabled={!!form.id} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </Field>
              <Field label='Full name'>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              <Field label='Role'>
                <SimpleSelect value={form.role} onChange={(role) => setForm({ ...form, role })} options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
              </Field>
              {form.role === "OPERATIONS" && (
                <Field label='Fire district' hint='Operations users can only edit stations in this district'>
                  <SimpleSelect
                    value={form.districtId}
                    onChange={(districtId) => setForm({ ...form, districtId })}
                    options={districts.map((d) => ({ value: d.id, label: d.alias ? `${d.name} · ${d.alias}` : d.name }))}
                  />
                </Field>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!password} onOpenChange={(o) => !o && setPassword(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Temporary password</DialogTitle>
            <DialogDescription>
              Give this to <b>{password?.username}</b>. It is shown only once; they must change it when they sign in.
            </DialogDescription>
          </DialogHeader>
          <div className='rounded-lg border bg-muted p-4 text-center font-mono text-lg tracking-wider select-all'>{password?.temporaryPassword}</div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => navigator.clipboard?.writeText(password.temporaryPassword).then(() => toast.success("Copied"))}
            >
              <Copy /> Copy
            </Button>
            <Button onClick={() => setPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
        title={`Remove ${confirmRemove?.username}?`}
        description='They will be signed out and can no longer sign in. Their name stays on past incidents.'
        confirmLabel='Remove'
        destructive
        onConfirm={() => {
          const u = confirmRemove;
          run(() => api(`/users/${u.id}`, { method: "DELETE" }), `${u.username} removed`);
        }}
      />
    </Page>
  );
}

export default UsersPage;
