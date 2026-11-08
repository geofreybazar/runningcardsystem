import { MapPin } from "lucide-react";

/** The chosen point: its label, city and coordinates; a hint until one is chosen. */
function PinnedLocation({ location, label, city }) {
  if (!location) return <p className='text-xs text-muted-foreground'>Search above, or click the map to drop a pin. Drag the pin to adjust.</p>;
  return (
    <div className='flex items-start gap-2 text-sm'>
      <MapPin className='mt-0.5 size-4 shrink-0 text-primary' />
      <div>
        <div className='font-medium'>
          {label}
          {city && <span className='block text-xs font-normal text-muted-foreground'>{city.name}</span>}
        </div>
        <div className='font-mono text-xs text-muted-foreground'>
          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      </div>
    </div>
  );
}

export default PinnedLocation;
