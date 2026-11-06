import { useId, cloneElement } from "react";
import { Label } from "@/components/ui/label";

/** Label + control + hint, wired together by id. */
function Field({ label, hint, children, className }) {
  const id = useId();
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, { id })}
      {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </div>
  );
}

export default Field;
