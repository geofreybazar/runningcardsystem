import { cn } from "@/lib/utils";

/** What to show when there is nothing (yet): an icon, one line saying why, and optionally what to do next. */
function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}>
      {Icon && <Icon className='size-7 text-muted-foreground/60' aria-hidden='true' />}
      {title && <p className='text-sm font-medium'>{title}</p>}
      {children && <div className='max-w-sm text-sm text-muted-foreground'>{children}</div>}
      {action && <div className='mt-1'>{action}</div>}
    </div>
  );
}

export default EmptyState;
