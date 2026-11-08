import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A Save button that spins and blocks a second click while the request (and the reload after it) runs. */
function SubmitButton({ saving, children, disabled, ...props }) {
  return (
    <Button disabled={saving || disabled} aria-busy={saving || undefined} {...props}>
      {saving && <LoaderCircle className='animate-spin' />} {children}
    </Button>
  );
}

export default SubmitButton;
