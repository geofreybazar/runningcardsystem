import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { googleMapsUrl } from "@/utils/coordinates.js";

/** Opens the pinned point in Google Maps in a new tab (the Maps app on phones), e.g. for directions. `compact`: icon only. */
function OpenInGoogleMaps({ position, className, compact = false }) {
  return (
    <Button variant='outline' size={compact ? "icon" : "sm"} className={className} asChild title='Open in Google Maps'>
      <a href={googleMapsUrl(position)} target='_blank' rel='noopener noreferrer' aria-label='Open in Google Maps'>
        <ExternalLink /> {!compact && "Open in Google Maps"}
      </a>
    </Button>
  );
}

export default OpenInGoogleMaps;
