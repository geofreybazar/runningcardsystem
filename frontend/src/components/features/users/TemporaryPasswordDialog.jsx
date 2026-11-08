import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { displayName } from "@/utils/person.js";

/** Shows a new or reset temporary password once. password: { user, temporaryPassword } or null. */
function TemporaryPasswordDialog({ password, onClose }) {
  return (
    <Dialog open={!!password} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Temporary password</DialogTitle>
          <DialogDescription>
            Give this to <b>{displayName(password?.user)}</b>. It is shown only once; they must change it when they sign in.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-1 text-sm'>
          <span className='text-muted-foreground'>Account number (sign-in name)</span>
          <span className='font-mono text-lg font-semibold'>{password?.user.accountNumber}</span>
        </div>
        <div className='rounded-lg border bg-muted p-4 text-center font-mono text-lg tracking-wider select-all'>{password?.temporaryPassword}</div>
        <DialogFooter>
          <Button variant='outline' onClick={() => navigator.clipboard?.writeText(password.temporaryPassword).then(() => toast.success("Copied"))}>
            <Copy /> Copy
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemporaryPasswordDialog;
