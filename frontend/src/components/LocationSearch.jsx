import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import SimpleSelect from "@/components/SimpleSelect.jsx";
import Field from "@/components/Field.jsx";
import { cn } from "@/lib/utils";
import variables from "@/variables/variables.js";
import { districtName } from "@/auth/permissions.js";
import { api } from "@/api/client.js";
import { useDistricts } from "@/api/query.js";

const { parseCoordinates, NCR_BOUNDS } = variables;

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
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-sm",
                i === active && "bg-accent text-accent-foreground"
              )}
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

function BarangayCombobox({ id, barangays, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className='w-full justify-between bg-card font-normal'
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value?.name ?? "Barangay"}</span>
          <ChevronsUpDown className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) min-w-56 p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search barangay…' />
          <CommandList>
            <CommandEmpty>No barangay found.</CommandEmpty>
            {barangays.map((b) => (
              <CommandItem
                key={b.id}
                value={b.name}
                onSelect={() => {
                  setOpen(false);
                  onChange(b);
                }}
              >
                {b.name}
                <Check className={cn("ml-auto", value?.id === b.id ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function LocationSearch({ onSelect }) {
  const geocoding = useMapsLibrary("geocoding");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const { data: districts = [] } = useDistricts();
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
  const { data: barangays = [] } = useQuery({
    queryKey: ["barangays", cityId],
    queryFn: () => api(`/cities/${cityId}/barangays`),
    enabled: !!cityId,
  });
  const [barangay, setBarangay] = useState(null);

  // BFP structure: District → City → Barangay. FD1 (Manila) and FD5 (Quezon City) have one city, so it is picked for you.
  const district = districts.find((d) => d.id === districtId);
  const city = district?.cities.find((c) => c.id === cityId);

  const pickDistrict = (id) => {
    const d = districts.find((x) => x.id === id);
    setDistrictId(id);
    pickCity(d?.cities.length === 1 ? d.cities[0].id : "");
  };
  const pickCity = (id) => {
    setCityId(id);
    setBarangay(null);
  };

  const pickBarangay = async (option) => {
    setBarangay(option);
    const label = `${option.name}, ${city.name}`;
    if (option.lat != null) {
      setError("");
      onSelect({ lat: option.lat, lng: option.lng }, label, option.id);
      return;
    }
    if (!geocoding) return;
    try {
      // First time this barangay is used: geocode it and save the pin so the next lookup is instant.
      const { results } = await new geocoding.Geocoder().geocode({
        address: `${option.name}, ${city.name}, Metro Manila, Philippines`,
        bounds: NCR_BOUNDS,
        region: "ph",
      });
      const point = results[0].geometry.location.toJSON();
      setError("");
      onSelect(point, label, option.id);
      api(`/barangays/${option.id}/location`, { method: "PUT", body: point })
        .then((saved) => queryClient.setQueryData(["barangays", cityId], (list) => list?.map((b) => (b.id === saved.id ? saved : b))))
        .catch(() => {});
    } catch {
      setError(`Could not find ${label} on the map. Try the search box or drop the pin.`);
    }
  };

  return (
    <div className='grid gap-3'>
      <PlaceSearch onSelect={onSelect} onError={setError} />
      {error && <p className='-mt-1 text-sm text-destructive'>{error}</p>}
      <div className='flex items-center gap-3 text-xs text-muted-foreground'>
        <div className='h-px flex-1 bg-border' />
        or pick by BFP district
        <div className='h-px flex-1 bg-border' />
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Field label='Fire district'>
          <SimpleSelect
            value={districtId}
            onChange={pickDistrict}
            placeholder='District'
            className='w-full bg-card'
            options={districts.map((d) => ({ value: d.id, label: districtName(d) }))}
          />
        </Field>
        <Field label='City'>
          <SimpleSelect
            value={cityId}
            onChange={pickCity}
            placeholder='City'
            className='w-full bg-card'
            disabled={!district || district.cities.length === 1}
            options={(district?.cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label='Barangay'>
          <BarangayCombobox barangays={barangays} value={barangay} onChange={pickBarangay} disabled={!cityId} />
        </Field>
      </div>
    </div>
  );
}

export default LocationSearch;
