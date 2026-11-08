import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NCR_BOUNDS } from "@/constants/map.js";
import { parseCoordinates } from "@/utils/coordinates.js";

/** Address / landmark search (Places API New) that also accepts typed coordinates on Enter. */
function PlaceSearch({ onSelect, onError }) {
  const places = useMapsLibrary("places");
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const tokenRef = useRef(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current || !places || !input.trim() || /^[\s\d.,-]+$/.test(input)) {
      skipNextFetch.current = false;
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      tokenRef.current ??= new places.AutocompleteSessionToken();
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: tokenRef.current,
          locationRestriction: NCR_BOUNDS,
          includedRegionCodes: ["ph"],
        });
        if (cancelled) return;
        setSuggestions(suggestions.map((s) => s.placePrediction).filter(Boolean));
        setActive(0);
        setOpen(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) onError("Address search failed. Check that Places API (New) is enabled for the key.");
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [places, input, onError]);

  const choose = async (prediction) => {
    setOpen(false);
    skipNextFetch.current = true; // don't search again for the label we just filled in
    setInput(prediction.text.toString());
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["location", "displayName", "formattedAddress"] });
      tokenRef.current = null; // fetchFields ends the billing session
      onError("");
      onSelect(place.location.toJSON(), place.displayName || place.formattedAddress);
    } catch (err) {
      console.error(err);
      onError("Could not get that place's location. Try another suggestion.");
    }
  };

  const onKeyDown = (e) => {
    if (open && suggestions.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions[active]) return choose(suggestions[active]);
      const coords = parseCoordinates(input);
      if (!coords) return onError("Pick a suggestion, or type 'latitude, longitude' inside Metro Manila, e.g. 14.5916, 121.0031");
      onError("");
      onSelect(coords, input.trim());
    }
  };

  return (
    <div className='relative'>
      <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        className='h-11 bg-card pl-9 text-base md:text-sm'
        placeholder='Address, landmark, or 14.5916, 121.0031'
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          onError("");
        }}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setOpen(false)}
        role='combobox'
        aria-expanded={open}
        aria-label='Search for an address, landmark, or coordinates'
      />
      {open && suggestions.length > 0 && (
        <ul className='absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md' role='listbox'>
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              role='option'
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus so blur doesn't close the list before the click lands
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-sm", i === active && "bg-accent text-accent-foreground")}
            >
              <MapPin className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
              <span>
                <span className='font-medium'>{s.mainText?.toString() ?? s.text.toString()}</span>
                {s.secondaryText && <span className='block text-xs text-muted-foreground'>{s.secondaryText.toString()}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlaceSearch;
