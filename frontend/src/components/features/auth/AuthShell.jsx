// The shell charcoal: the sign-in panel matches the app's sidebar and top bar.
const CRIMSON = "var(--shell)";

// Backdrop photo (CC BY-SA 4.0): the licence requires this credit wherever the photo is shown.
const PHOTO_CREDIT = {
  text: "Photo: Captainmorlypogi1959, CC BY-SA 4.0",
  href: "https://commons.wikimedia.org/wiki/File:MAN_TGM_18.250_Rosenbauer_Fire_Truck_(2).jpg",
};

/**
 * Sign-in pages: the form on a white side; on the other, a deep BFP-crimson panel with a flowing two-layer edge,
 * a faded BFP fire truck photo and the app name. Phones get the panel as a band above the form.
 */
function AuthShell({ title, description, children }) {
  return (
    <div className='grid min-h-svh grid-rows-[auto_1fr] bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-1'>
      <aside
        className='relative isolate overflow-hidden border-t-4 border-primary px-8 py-10 text-white lg:order-2 lg:border-t-0 lg:border-l-4 lg:flex lg:flex-col lg:justify-center lg:overflow-visible lg:py-14 lg:pr-16 lg:pl-24'
        style={{ background: CRIMSON }}
      >
        {/* The photo is tinted into the crimson and fades out towards the curve, so the edge stays clean. */}
        <img
          src='/login-truck.webp'
          alt=''
          className='absolute inset-0 -z-10 size-full object-cover opacity-[0.18] mix-blend-luminosity [mask-image:linear-gradient(to_right,transparent,black_35%)]'
        />
        {/* Flowing edge: a lighter translucent wave behind a solid one, both reaching into the form side. */}
        <svg viewBox='0 0 100 100' preserveAspectRatio='none' className='absolute inset-y-0 right-full hidden h-full w-40 lg:block' aria-hidden='true'>
          <path d='M100 0C30 18 85 52 18 100H100Z' fill={CRIMSON} opacity='0.28' />
          <path d='M100 0C52 22 100 58 52 100H100Z' fill={CRIMSON} />
        </svg>

        <div className='relative'>
          <p className='font-condensed text-4xl font-semibold tracking-wide lg:text-6xl'>Running Card System</p>
          <div className='my-4 h-px w-16 bg-gold lg:my-6' />
          <p className='text-sm text-white/85 lg:text-base'>Bureau of Fire Protection</p>
          <p className='text-sm text-white/65 lg:text-base'>National Capital Region</p>
        </div>
        <a
          href={PHOTO_CREDIT.href}
          target='_blank'
          rel='noreferrer'
          className='absolute right-3 bottom-2 text-[10px] text-white/45 hover:text-white/80 hover:underline'
        >
          {PHOTO_CREDIT.text}
        </a>
      </aside>

      <main className='flex flex-col px-6 py-8 sm:px-10 lg:order-1 lg:px-16 lg:py-10'>
        <img src='/logo.webp' alt='Bureau of Fire Protection, Bagong Pilipinas and BFP NCR emblems' width={375} height={110} className='h-auto w-44' />
        <div className='flex flex-1 items-center py-10'>
          <div className='w-full max-w-sm'>
            <h1 className='text-4xl font-light tracking-tight'>{title}</h1>
            {description && <p className='mt-2 text-sm text-muted-foreground'>{description}</p>}
            <div className='mt-8'>{children}</div>
          </div>
        </div>
        <p className='text-xs text-muted-foreground'>For authorized BFP-NCR personnel only.</p>
      </main>
    </div>
  );
}

export default AuthShell;
