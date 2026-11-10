import { cn } from "@/lib/utils";

/** The filter / search row above a list: controls on the left, a count or actions on the right. */
function Toolbar({ children, end, className }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
      {end && <div className='ml-auto flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>{end}</div>}
    </div>
  );
}

export default Toolbar;
