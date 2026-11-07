import { Flame } from "lucide-react";

/** Split screen for sign-in pages: BFP-red brand panel on wide screens, form on the right. */
function AuthShell({ title, description, children }) {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex'>
        <div className='flex items-center gap-2 font-semibold'>
          <div className='flex size-9 items-center justify-center rounded-lg bg-white/15 text-gold'>
            <Flame className='size-5' fill='currentColor' />
          </div>
          Bureau of Fire Protection, NCR
        </div>
        <div>
          <div className='mb-4 h-1 w-16 rounded bg-gold' />
          <h2 className='text-3xl font-semibold leading-tight'>Running Card System</h2>
          <p className='mt-2 max-w-sm text-primary-foreground/80'>
            Find the nearest fire stations, dispatch the right trucks, and track every alarm across Metro Manila.
          </p>
        </div>
        <p className='text-xs text-primary-foreground/60'>For authorized BFP-NCR personnel only.</p>
        <Flame className='pointer-events-none absolute -right-16 -bottom-16 size-80 text-white/5' fill='currentColor' />
      </div>
      <div className='flex items-center justify-center p-6'>
        <div className='w-full max-w-sm'>
          <div className='mb-8 flex items-center gap-2 lg:hidden'>
            <div className='flex size-9 items-center justify-center rounded-lg bg-primary text-gold'>
              <Flame className='size-5' fill='currentColor' />
            </div>
            <div className='leading-tight'>
              <div className='font-semibold'>BFP-NCR</div>
              <div className='text-xs text-muted-foreground'>Running Card System</div>
            </div>
          </div>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          {description && <p className='mt-1 text-sm text-muted-foreground'>{description}</p>}
          <div className='mt-6'>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
