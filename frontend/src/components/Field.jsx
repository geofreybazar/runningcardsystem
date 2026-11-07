import { useId, cloneElement } from "react";
import { Label } from "@/components/ui/label";

/** Label + control + hint or error, wired together by id; an error marks the control invalid and replaces the hint. */
function Field({ label, hint, error, children, className }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;
  return (
    <div className={`grid content-start gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": message ? messageId : undefined })}
      {message && (
        <p id={messageId} className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Field;
