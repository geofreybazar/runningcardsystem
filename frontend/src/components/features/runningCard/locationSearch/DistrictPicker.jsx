import { useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import Field from "@/components/common/Field.jsx";
import { NCR_BOUNDS } from "@/constants/map.js";
import { districtName } from "@/utils/permissions.js";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import useGetBarangays from "@/hooks/districts/useGetBarangays.js";
import useSaveBarangayPin from "@/hooks/districts/useSaveBarangayPin.js";
import BarangayCombobox from "./BarangayCombobox.jsx";

/**
 * BFP structure: District → City → Barangay. FD1 (Manila) and FD5 (Quezon City) have one city, so it is picked for
 * you. A barangay without a saved pin is geocoded once and its pin saved, so the next lookup is instant.
 */
function DistrictPicker({ onSelect, onError }) {
  const geocoding = useMapsLibrary("geocoding");
  const { data: districts = [] } = useGetDistricts();
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
  const { data: barangays = [] } = useGetBarangays(cityId);
  const { mutate: saveBarangayPin } = useSaveBarangayPin(cityId);
  const [barangay, setBarangay] = useState(null);

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
      onError("");
      onSelect({ lat: option.lat, lng: option.lng }, label, option.id);
      return;
    }
    if (!geocoding) return;
    try {
      const { results } = await new geocoding.Geocoder().geocode({
        address: `${option.name}, ${city.name}, Metro Manila, Philippines`,
        bounds: NCR_BOUNDS,
        region: "ph",
      });
      const point = results[0].geometry.location.toJSON();
      onError("");
      onSelect(point, label, option.id);
      saveBarangayPin({ id: option.id, ...point });
    } catch {
      onError(`Could not find ${label} on the map. Try the search box or drop the pin.`);
    }
  };

  return (
    <div className='grid gap-3'>
      <Field label='Fire district'>
        <SimpleSelect value={districtId} onChange={pickDistrict} placeholder='District' options={districts.map((d) => ({ value: d.id, label: districtName(d) }))} />
      </Field>
      <Field label='City'>
        <SimpleSelect
          value={cityId}
          onChange={pickCity}
          placeholder='City'
          disabled={!district || district.cities.length === 1}
          options={(district?.cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
      </Field>
      <Field label='Barangay'>
        <BarangayCombobox barangays={barangays} value={barangay} onChange={pickBarangay} disabled={!cityId} />
      </Field>
    </div>
  );
}

export default DistrictPicker;
