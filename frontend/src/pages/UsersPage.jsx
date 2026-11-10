import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Page from "@/components/common/Page.jsx";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import Panel from "@/components/common/Panel.jsx";
import EmptyState from "@/components/common/EmptyState.jsx";
import MobileView from "@/components/features/users/table/MobileView.jsx";
import DesktopView from "@/components/features/users/table/DesktopView.jsx";
import UserFormDialog from "@/components/features/users/UserFormDialog.jsx";
import TemporaryPasswordDialog from "@/components/features/users/TemporaryPasswordDialog.jsx";
import UserFilters from "@/components/features/users/UserFilters.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetUsers from "@/hooks/users/useGetUsers.js";
import useChangeUserStatus from "@/hooks/users/useChangeUserStatus.js";
import useResetPassword from "@/hooks/users/useResetPassword.js";
import useRemoveUser from "@/hooks/users/useRemoveUser.js";
import { displayName } from "@/utils/person.js";
import { EMPTY_USER, manageableRoles, userToForm } from "@/utils/userForm.js";
import { NO_FILTERS, filterUsers } from "@/utils/userFilters.js";

function UsersPage() {
  const { user: me } = useAuth();
  const { data: users = [], isPending } = useGetUsers();
  const { mutate: changeStatus } = useChangeUserStatus();
  const { mutateAsync: resetPassword } = useResetPassword();
  const { mutate: removeUser } = useRemoveUser();

  const [form, setForm] = useState(null); // the user being added or edited
  const [password, setPassword] = useState(null); // { user, temporaryPassword }
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [filters, setFilters] = useState(NO_FILTERS);
  const shown = useMemo(() => filterUsers(users, filters), [users, filters]);

  const roles = manageableRoles(me.role);
  const editable = (u) => roles.includes(u.role) && u.id !== me.id;
  const views = {
    users: shown,
    editable,
    onEdit: (u) => setForm(userToForm(u)),
    onReset: (u) =>
      resetPassword(u).then(
        (res) => setPassword({ user: u, temporaryPassword: res.temporaryPassword }),
        () => {},
      ),
    onRemove: setConfirmRemove,
    onSetActive: (u, isActive) => changeStatus({ user: u, isActive }),
  };

  return (
    <Page
      title='Users'
      description='Create accounts, disable access, and reset passwords.'
      actions={
        <Button onClick={() => setForm(EMPTY_USER)}>
          <Plus /> Add user
        </Button>
      }
    >
      <UserFilters filters={filters} onChange={setFilters} shown={shown.length} total={users.length} />
      <Panel flush>
        {isPending ? (
          <ListSkeleton className='p-3' />
        ) : shown.length === 0 ? (
          <EmptyState icon={Users} title='No users match these filters.' />
        ) : (
          <>
            <MobileView {...views} />
            <DesktopView {...views} />
          </>
        )}
      </Panel>

      <UserFormDialog
        initial={form}
        onClose={() => setForm(null)}
        onCreated={(res) => setPassword({ user: res.user, temporaryPassword: res.temporaryPassword })}
      />
      <TemporaryPasswordDialog password={password} onClose={() => setPassword(null)} />

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
        title={`Remove ${displayName(confirmRemove)}?`}
        description='They will be signed out and can no longer sign in. Their name stays on past incidents.'
        confirmLabel='Remove'
        destructive
        onConfirm={() => removeUser(confirmRemove)}
      />
    </Page>
  );
}

export default UsersPage;
