import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { TextField, Autocomplete, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import variables from "../variables/variables.js";

const { parseCoordinates, NCR_BOUNDS } = variables;

// The barangay package bundles the whole country (~600 KB), so load it only when needed.
const loadBarangays = async () => {
  const { default: barangay } = await import("barangay");
  const cities = barangay.dump["NATIONAL CAPITAL REGION"]["METRO MANILA"];
  return Object.entries(cities).flatMap(([city, brgys]) =>
    brgys.map((name) => ({ name, city }))
  );
};

function LocationSearch({ onSelect }) {
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");
  const [error, setError] = useState("");
  const [barangays, setBarangays] = useState(null);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const tokenRef = useRef(null);

  // Addresses and landmarks: Places API (New) suggestions, debounced while typing.
  useEffect(() => {
    if (!places || !input.trim() || /^[\s\d.,-]+$/.test(input)) {
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
        if (!cancelled) setSuggestions(suggestions.map((s) => s.placePrediction).filter(Boolean));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Address search failed. Check that Places API (New) is enabled for the key.");
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [places, input]);

  const handleSearch = async (_, value) => {
    if (!value) return;
    // Enter on free text: only coordinates are accepted that way.
    if (typeof value === "string") {
      const coords = parseCoordinates(value);
      if (!coords) {
        setError("Pick a suggestion, or type 'latitude, longitude' inside Metro Manila, e.g. 14.5916, 121.0031");
        return;
      }
      setError("");
      onSelect(coords, value.trim());
      return;
    }
    try {
      const place = value.toPlace();
      await place.fetchFields({ fields: ["location", "displayName", "formattedAddress"] });
      tokenRef.current = null; // fetchFields ends the billing session
      setError("");
      onSelect(place.location.toJSON(), place.displayName || place.formattedAddress);
    } catch (err) {
      console.error(err);
      setError("Could not get that place's location. Try another suggestion.");
    }
  };

  const handleBarangay = async (_, option) => {
    if (!option || !geocoding) return;
    const label = `${option.name}, ${option.city}`;
    try {
      const { results } = await new geocoding.Geocoder().geocode({
        address: `${label}, Metro Manila, Philippines`,
        bounds: NCR_BOUNDS,
        region: "ph",
      });
      setError("");
      onSelect(results[0].geometry.location.toJSON(), label);
    } catch {
      setError(`Could not find ${label} on the map. Try the search box or drop the pin.`);
    }
  };

  return (
    <div className='flex flex-col gap-3'>
      <Autocomplete
        freeSolo
        options={suggestions}
        filterOptions={(x) => x}
        getOptionLabel={(o) => (typeof o === "string" ? o : o.text.toString())}
        inputValue={input}
        onInputChange={(_, v, reason) => {
          setInput(v);
          if (reason === "reset") setSuggestions([]); // picked an option; don't search its label again
          setError("");
        }}
        onChange={handleSearch}
        renderInput={(params) => (
          <TextField
            {...params}
            label='Address, landmark, or coordinates'
            placeholder='e.g. SM North EDSA  or  14.5916, 121.0031'
            error={!!error}
            helperText={error || " "}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
      />
      <Autocomplete
        options={barangays || []}
        loading={!barangays}
        onOpen={() => !barangays && loadBarangays().then(setBarangays)}
        groupBy={(o) => o.city}
        getOptionLabel={(o) => `${o.name}, ${o.city}`}
        renderOption={(props, o) => (
          <li {...props} key={`${o.city}-${o.name}`}>
            {o.name}
          </li>
        )}
        onChange={handleBarangay}
        renderInput={(params) => <TextField {...params} label='Or pick a barangay' />}
      />
    </div>
  );
}

export default LocationSearch;
