import { cn } from "@/lib/utils";

/**
 * Standard page frame. The title is shown once, as the top bar's h1 (from the nav label, or usePageTitle on detail
 * pages); `title` here only names the region for screen readers. The description and actions form the page's toolbar.
 */
function Page({ title, description, actions, children, className }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 p-3 md:p-5", className)} role='region' aria-label={typeof title === "string" ? title : undefined}>
      {(description || actions) && (
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {description && <p className='max-w-2xl text-sm text-muted-foreground'>{description}</p>}
          {actions && <div className='ml-auto flex flex-wrap items-center gap-2'>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default Page;
