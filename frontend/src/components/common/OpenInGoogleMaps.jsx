import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { googleMapsUrl } from "@/utils/coordinates.js";

/** Opens the pinned point in Google Maps in a new tab (the Maps app on phones), e.g. for directions. */
function OpenInGoogleMaps({ position, className }) {
  return (
    <Button variant='outline' size='sm' className={className} asChild>
      <a href={googleMapsUrl(position)} target='_blank' rel='noopener noreferrer'>
        <ExternalLink /> Open in Google Maps
      </a>
    </Button>
  );
}

export default OpenInGoogleMaps;
