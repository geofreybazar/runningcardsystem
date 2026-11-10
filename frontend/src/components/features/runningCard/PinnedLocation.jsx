import { MapPin } from "lucide-react";
import OpenInGoogleMaps from "@/components/common/OpenInGoogleMaps.jsx";

/** The fire location block at the top of the dispatch panel: label, city, coordinates, and directions. */
function PinnedLocation({ location, label, city }) {
  return (
    <div className='flex items-start gap-3 border-b px-4 py-3'>
      <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground'>
        <MapPin className='size-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <div className='text-label text-muted-foreground'>Fire location</div>
        <div className='truncate font-semibold' title={label}>
          {label}
        </div>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground'>
          <span>{city ? city.name : "Outside Metro Manila"}</span>
          <span className='font-data'>
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </span>
        </div>
      </div>
      <OpenInGoogleMaps position={location} className='shrink-0' compact />
    </div>
  );
}

export default PinnedLocation;
