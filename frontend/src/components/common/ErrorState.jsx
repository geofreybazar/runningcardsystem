import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A failed load: the reason and a retry, in the danger tone. */
function ErrorState({ error, onRetry }) {
  return (
    <div role='alert' className='flex flex-wrap items-center gap-3 rounded-md border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-danger-foreground'>
      <TriangleAlert className='size-4 shrink-0' />
      <span className='flex-1'>{error?.message ?? "Could not load this. Check your connection."}</span>
      {onRetry && (
        <Button size='sm' variant='outline' onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
