import { useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import Field from "@/components/common/Field.jsx";
import { NCR_BOUNDS } from "@/constants/map.js";
import { districtName } from "@/utils/permissions.js";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import useGetBarangays from "@/hooks/districts/useGetBarangays.js";
import useSaveBarangayPin from "@/hooks/districts/useSaveBarangayPin.js";
import PlaceSearch from "./PlaceSearch.jsx";
import BarangayCombobox from "./BarangayCombobox.jsx";

function LocationSearch({ onSelect }) {
  const geocoding = useMapsLibrary("geocoding");
  const [error, setError] = useState("");
  const { data: districts = [] } = useGetDistricts();
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
  const { data: barangays = [] } = useGetBarangays(cityId);
  const { mutate: saveBarangayPin } = useSaveBarangayPin(cityId);
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
      saveBarangayPin({ id: option.id, ...point });
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
