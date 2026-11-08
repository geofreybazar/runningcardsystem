/** Full logo when the sidebar is open; the NCR badge when it is collapsed to icons. */
function Brand() {
  return (
    <div className='px-1 py-1.5'>
      <div className='grid gap-1 group-data-[collapsible=icon]:hidden'>
        <img src='/logo.webp' alt='Bureau of Fire Protection NCR' width={375} height={110} className='h-auto w-full' />
        <span className='text-center text-xs font-medium text-muted-foreground'>Running Card System</span>
      </div>
      <img src='/logo-badge.webp' alt='BFP-NCR' width={32} height={32} className='hidden size-8 group-data-[collapsible=icon]:block' />
    </div>
  );
}

export default Brand;
