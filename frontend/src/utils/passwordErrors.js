import { formErrors } from "./validation.js";
import { changePasswordSchema } from "@shared/validation";

/** The shared rules for the new password, plus the confirmation (a form-only field). */
export function passwordErrors(currentPassword, newPassword, confirm) {
  const errors = { ...formErrors(changePasswordSchema, { currentPassword, newPassword }) };
  if (confirm !== newPassword) errors.confirm = "The new passwords don't match";
  return Object.keys(errors).length ? errors : null;
}
