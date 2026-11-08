/** Lucide has no fire truck: drawn in its style (24 grid, 2px round strokes) — ladder on top, body, cab, wheels. */
function FireTruckIcon({ className }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      aria-hidden='true'
    >
      <path d='M2 5h10M2 8h10M5 5v3M9 5v3' />
      <path d='M4 17H2v-6h12v6H8M14 11h4l3 3v3h-2' />
      <circle cx='6' cy='17' r='2' />
      <circle cx='17' cy='17' r='2' />
      <path d='M14 17h1' />
    </svg>
  );
}

export default FireTruckIcon;
