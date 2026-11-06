import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { TextField, Autocomplete, InputAdornment, MenuItem } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import variables from "../variables/variables.js";
import { api } from "../api/client.js";

const { parseCoordinates, NCR_BOUNDS } = variables;

function LocationSearch({ onSelect }) {
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");
  const [error, setError] = useState("");
  const [districts, setDistricts] = useState([]);
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
  const [barangays, setBarangays] = useState([]);
  const [barangay, setBarangay] = useState(null);
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

  // BFP structure: District → City → Barangay. FD1 (Manila) and FD5 (Quezon City) have one city, so it is picked for you.
  useEffect(() => {
    api("/districts").then(setDistricts).catch(() => {});
  }, []);
  const district = districts.find((d) => d.id === districtId);
  const city = district?.cities.find((c) => c.id === cityId);

  const pickDistrict = (id) => {
    const d = districts.find((x) => x.id === id);
    setDistrictId(id);
    setCityId(d?.cities.length === 1 ? d.cities[0].id : "");
  };

  useEffect(() => {
    setBarangay(null);
    setBarangays([]);
    if (cityId) api(`/cities/${cityId}/barangays`).then(setBarangays).catch(() => {});
  }, [cityId]);

  const handleBarangay = async (_, option) => {
    setBarangay(option);
    if (!option) return;
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
        .then((saved) => setBarangays((list) => list.map((b) => (b.id === saved.id ? saved : b))))
        .catch(() => {});
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
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <TextField select label='Fire district' value={districtId} onChange={(e) => pickDistrict(e.target.value)}>
          {districts.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
              {d.alias ? ` · ${d.alias}` : ""}
            </MenuItem>
          ))}
        </TextField>
        {district?.cities.length > 1 ? (
          <TextField select label='City' value={cityId} onChange={(e) => setCityId(e.target.value)}>
            {district.cities.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField label='City' value={city?.name ?? ""} disabled />
        )}
        <Autocomplete
          options={barangays}
          value={barangay}
          disabled={!cityId}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={handleBarangay}
          renderInput={(params) => <TextField {...params} label='Barangay' />}
        />
      </div>
    </div>
  );
}

export default LocationSearch;
