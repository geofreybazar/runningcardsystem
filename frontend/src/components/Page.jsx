import { cn } from "@/lib/utils";

/** Standard page frame: title row with optional actions, then content. */
function Page({ title, description, actions, children, className }) {
  return (
    <div className={cn("flex flex-col gap-4 p-4 md:p-6", className)}>
      {(title || actions) && (
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            {title && <h1 className='text-xl font-semibold tracking-tight md:text-2xl'>{title}</h1>}
            {description && <p className='text-sm text-muted-foreground'>{description}</p>}
          </div>
          {actions && <div className='flex flex-wrap gap-2'>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default Page;
