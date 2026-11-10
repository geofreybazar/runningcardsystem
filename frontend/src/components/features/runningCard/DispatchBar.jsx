import { Siren } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The one loud control on the page: dispatch the first alarm. Stays at the bottom of the dispatch panel. */
function DispatchBar({ alarmLevel, trucks, disabled, onDispatch }) {
  return (
    <div className='grid gap-1.5'>
      <Button size='lg' className='h-12 w-full text-base font-semibold shadow-sm' onClick={onDispatch} disabled={disabled}>
        <Siren className='size-5' /> Dispatch {alarmLevel}
      </Button>
      <p className='text-center text-xs text-muted-foreground'>
        Sends {trucks} truck{trucks === 1 ? "" : "s"}, one per station, and marks them Responding. You confirm next.
      </p>
    </div>
  );
}

export default DispatchBar;
