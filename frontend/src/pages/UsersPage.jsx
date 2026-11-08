import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Page from "@/components/common/Page.jsx";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import MobileView from "@/components/features/users/table/MobileView.jsx";
import DesktopView from "@/components/features/users/table/DesktopView.jsx";
import UserFormDialog from "@/components/features/users/UserFormDialog.jsx";
import TemporaryPasswordDialog from "@/components/features/users/TemporaryPasswordDialog.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetUsers from "@/hooks/users/useGetUsers.js";
import useChangeUserStatus from "@/hooks/users/useChangeUserStatus.js";
import useResetPassword from "@/hooks/users/useResetPassword.js";
import useRemoveUser from "@/hooks/users/useRemoveUser.js";
import { displayName } from "@/utils/person.js";
import { EMPTY_USER, manageableRoles, userToForm } from "@/utils/userForm.js";

function UsersPage() {
  const { user: me } = useAuth();
  const { data: users = [], isPending } = useGetUsers();
  const { mutate: changeStatus } = useChangeUserStatus();
  const { mutateAsync: resetPassword } = useResetPassword();
  const { mutate: removeUser } = useRemoveUser();

  const [form, setForm] = useState(null); // the user being added or edited
  const [password, setPassword] = useState(null); // { user, temporaryPassword }
  const [confirmRemove, setConfirmRemove] = useState(null);

  const roles = manageableRoles(me.role);
  const editable = (u) => roles.includes(u.role) && u.id !== me.id;
  const views = {
    users,
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
      {isPending ? (
        <ListSkeleton />
      ) : (
        <>
          <MobileView {...views} />
          <DesktopView {...views} />
        </>
      )}

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
