/**
 * The first message per field when `value` fails `schema` (one of the rules shared with the API, `@shared/validation`),
 * keyed by top-level field name; null when it is valid.
 */
export function formErrors(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return null;
  const errors = {};
  for (const issue of result.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return errors;
}
