import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Field from "@/components/common/Field.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import useAddUser from "@/hooks/users/useAddUser.js";
import useEditUser from "@/hooks/users/useEditUser.js";
import { ROLE_LABELS } from "@/constants/roles.js";
import { OFFICE_LABELS, OFFICE_LEVELS } from "@/constants/office.js";
import { districtName } from "@/utils/permissions.js";
import { formErrors } from "@/utils/validation.js";
import { dispatchNote, hasCityOffices, manageableRoles, normalizeOffice, userBody } from "@/utils/userForm.js";
import { RANKS, userFormSchema } from "@shared/validation";

/** Add (initial without id) or edit a user. `initial` null = closed. A new account's temporary password goes to onCreated. */
function UserFormDialog({ initial, onClose, onCreated }) {
  const { user: me } = useAuth();
  const { data: districts = [] } = useGetDistricts();
  const { mutateAsync: addUser } = useAddUser();
  const { mutateAsync: editUser } = useEditUser();
  const roles = manageableRoles(me.role);

  const [form, setForm] = useState(initial);
  const [formError, setFormError] = useState("");
  const [tried, setTried] = useState(false); // after the first Save attempt, errors follow the form as it is edited
  // A newly opened dialog starts from its own values.
  const [shown, setShown] = useState(initial);
  if (initial !== shown) {
    setShown(initial);
    setForm(initial);
    setFormError("");
    setTried(false);
  }

  const errors = tried && form ? formErrors(userFormSchema, userBody(form)) : null;

  const save = async () => {
    setFormError("");
    setTried(true);
    const body = userBody(form);
    if (formErrors(userFormSchema, body)) return; // shown under the fields
    try {
      if (form.id) await editUser({ id: form.id, ...body });
      else onCreated(await addUser(body));
      onClose();
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <Dialog open={!!initial} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{form?.id ? "Edit user" : "Add user"}</DialogTitle>
          {!form?.id && <DialogDescription>A temporary password is generated; they choose their own at first sign-in.</DialogDescription>}
        </DialogHeader>
        {form && (
          // One column on phones, two from sm up; full-width rows use sm:col-span-2.
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {formError && (
              <Alert variant='destructive' className='sm:col-span-2'>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            {form.role !== "SUPER_ADMIN" && (
              <Field label='Rank' className='sm:col-span-2' error={errors?.rank}>
                <SimpleSelect
                  value={form.rank}
                  placeholder='Select rank…'
                  onChange={(rank) => setForm({ ...form, rank })}
                  options={RANKS.map((r) => ({ value: r, label: r }))}
                />
              </Field>
            )}
            <Field label='First name' error={errors?.firstName}>
              <Input value={form.firstName} autoComplete='off' onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label='Middle name' hint='Optional' error={errors?.middleName}>
              <Input value={form.middleName} autoComplete='off' onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
            </Field>
            <Field label='Last name' error={errors?.lastName}>
              <Input value={form.lastName} autoComplete='off' onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label='Account number' hint='Their sign-in name, e.g. B13084' error={errors?.accountNumber}>
              <Input
                value={form.accountNumber}
                autoComplete='off'
                autoCapitalize='characters'
                spellCheck={false}
                className='font-mono uppercase'
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
            </Field>
            <Field label='Role' error={errors?.role}>
              <SimpleSelect
                value={form.role}
                onChange={(role) => setForm(normalizeOffice({ ...form, role }, districts))}
                options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              />
            </Field>
            <Field label='Office' error={errors?.officeLevel}>
              <SimpleSelect
                value={form.officeLevel}
                disabled={OFFICE_LEVELS[form.role].length === 1}
                onChange={(officeLevel) => setForm(normalizeOffice({ ...form, officeLevel }, districts))}
                options={OFFICE_LEVELS[form.role].map((l) => ({ value: l, label: OFFICE_LABELS[l] }))}
              />
            </Field>
            {form.officeLevel !== "REGIONAL" && (
              <div className='grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2'>
                <Field label='Fire district' error={errors?.districtId}>
                  <SimpleSelect
                    value={form.districtId}
                    onChange={(districtId) => setForm(normalizeOffice({ ...form, districtId }, districts))}
                    options={districts.filter((d) => form.officeLevel !== "CITY" || hasCityOffices(d)).map((d) => ({ value: d.id, label: districtName(d) }))}
                  />
                </Field>
                {form.officeLevel === "CITY" && (
                  <Field label='City' error={errors?.cityId}>
                    <SimpleSelect
                      value={form.cityId}
                      disabled={!form.districtId}
                      onChange={(cityId) => setForm({ ...form, cityId })}
                      options={(districts.find((d) => d.id === form.districtId)?.cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </Field>
                )}
              </div>
            )}
            {dispatchNote(form, districts) && <p className='text-xs text-muted-foreground sm:col-span-2'>{dispatchNote(form, districts)}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserFormDialog;
