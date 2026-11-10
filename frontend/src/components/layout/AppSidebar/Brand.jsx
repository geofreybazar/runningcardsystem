/** System identity: the BFP-NCR badge, the office and the system name; just the badge when collapsed to icons. */
function Brand() {
  return (
    <div className='flex items-center gap-2.5 px-1 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
      <img src='/logo-badge.webp' alt='' width={32} height={32} className='size-8 shrink-0' />
      <div className='grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden'>
        <span className='font-data text-lg font-semibold tracking-wide'>BFP-NCR</span>
        <span className='truncate text-[11px] text-shell-muted'>Running Card System</span>
      </div>
      <span className='sr-only'>Bureau of Fire Protection, National Capital Region: Running Card System</span>
    </div>
  );
}

export default Brand;
