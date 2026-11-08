import { Siren } from "lucide-react";
import { Button } from "@/components/ui/button";

/** What Dispatch does, and the button that opens the dispatch dialog. */
function DispatchBar({ alarmLevel, disabled, onDispatch }) {
  return (
    <div className='flex flex-col gap-3 rounded-xl border border-primary/20 bg-accent p-3 sm:flex-row sm:items-center'>
      <Siren className='hidden size-5 shrink-0 text-primary sm:block' />
      <p className='flex-1 text-sm'>
        Dispatch sends one truck from each <b>{alarmLevel}</b> station and marks it Responding.
      </p>
      <Button onClick={onDispatch} disabled={disabled}>
        Dispatch {alarmLevel}
      </Button>
    </div>
  );
}

export default DispatchBar;
