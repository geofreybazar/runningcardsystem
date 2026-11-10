import { cn } from "@/lib/utils";

/**
 * A flat, bordered section with a header bar (title, optional meta and actions) and a body. The house container for
 * lists, tables and forms; use `flush` when the body is a table or list that brings its own row padding.
 */
function Panel({ title, meta, actions, children, flush = false, className, bodyClassName, as: Tag = "section", ...rest }) {
  return (
    <Tag className={cn("min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground", className)} {...rest}>
      {(title || actions) && (
        <header className='flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-muted/40 px-3 py-1.5'>
          <div className='flex min-w-0 items-baseline gap-2'>
            {title && <h2 className='truncate text-sm font-semibold'>{title}</h2>}
            {meta && <span className='text-xs text-muted-foreground'>{meta}</span>}
          </div>
          {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && "p-3", bodyClassName)}>{children}</div>
    </Tag>
  );
}

export default Panel;
