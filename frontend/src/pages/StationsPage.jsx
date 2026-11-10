import { useMemo, useState } from "react";
import { Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Page from "@/components/common/Page.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import EmptyState from "@/components/common/EmptyState.jsx";
import StationList from "@/components/features/stations/StationList.jsx";
import ResourceSummary from "@/components/features/stations/ResourceSummary.jsx";
import StationDetail from "@/components/features/stations/StationDetail.jsx";
import StationFormDialog from "@/components/features/stations/StationFormDialog.jsx";
import TruckFormDialog from "@/components/features/stations/TruckFormDialog.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import useGetStations from "@/hooks/stations/useGetStations.js";
import useDeactivateStation from "@/hooks/stations/useDeactivateStation.js";
import { canEditCity, districtName } from "@/utils/permissions.js";
import { stationToForm, truckToForm } from "@/utils/stationForm.js";

function StationsPage() {
  const { user } = useAuth();
  const { data: districts = [] } = useGetDistricts();
  // Regional accounts open on the whole region; district and city offices on their own district.
  const [districtId, setDistrictId] = useState(user.districtId ?? "ALL");
  const [cityId, setCityId] = useState("ALL"); // only for districts with several cities (FD II, III, IV)
  const { data: stations = [], isPending } = useGetStations(districtId);
  const { mutate: deactivateStation } = useDeactivateStation();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [stationForm, setStationForm] = useState(null);
  const [truckForm, setTruckForm] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const allDistricts = districtId === "ALL";
  const district = districts.find((d) => d.id === districtId);
  const cities = district && district.cities.length > 1 ? district.cities : null;
  // The city filter narrows the list and the Resources table; search narrows the list further.
  const inCity = useMemo(() => (cityId === "ALL" ? stations : stations.filter((s) => s.cityId === cityId)), [stations, cityId]);
  const visible = useMemo(() => inCity.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())), [inCity, search]);
  const selected = inCity.find((s) => s.id === selectedId);
  const editableCities = (allDistricts ? districts.flatMap((d) => d.cities) : (district?.cities ?? [])).filter((c) => canEditCity(user, c.id));
  const canAddHere = editableCities.length > 0;
  const editable = !!selected && canEditCity(user, selected.cityId); // the selected station
  const selectedDistrict = selected && districts.find((d) => d.id === selected.districtId); // for the edit form's cities

  const pickDistrict = (id) => {
    setDistrictId(id);
    setCityId("ALL");
    setSelectedId(null);
  };
  const pickCity = (id) => {
    setCityId(id);
    setSelectedId(null);
  };

  return (
    <Page
      // Wide screens: the page fits the window under the top bar; the station list and the detail scroll inside their panels.
      className='lg:h-[calc(100svh-3rem)] lg:overflow-hidden'
      title='Stations & Trucks'
      description={
        canAddHere
          ? undefined
          : "View only. Stations and trucks are maintained by each city's Operations office (Manila and Quezon City: their Fire District office)."
      }
      actions={
        <>
          <SimpleSelect
            value={districtId}
            onChange={pickDistrict}
            className='w-full bg-card sm:w-64'
            aria-label='Fire district'
            options={[{ value: "ALL", label: "All districts" }, ...districts.map((d) => ({ value: d.id, label: districtName(d) }))]}
          />
          {cities && (
            <SimpleSelect
              value={cityId}
              onChange={pickCity}
              className='w-full bg-card sm:w-48'
              aria-label='City'
              options={[{ value: "ALL", label: "All cities" }, ...cities.map((c) => ({ value: c.id, label: c.name }))]}
            />
          )}
          {canAddHere && (
            <Button onClick={() => setStationForm(stationToForm(null, editableCities))}>
              <Plus /> Add station
            </Button>
          )}
        </>
      }
    >
      {!isPending && (
        <ResourceSummary
          stations={inCity}
          groupBy={allDistricts ? "district" : "city"}
          totalLabel={allDistricts ? "NCR total" : "District total"}
        />
      )}

      {/* Fixed list column; the detail column may shrink (minmax(0,…)) so long call signs scroll inside it instead of resizing the layout. */}
      <div className='grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]'>
        {/* On small screens the list and the detail take turns. */}
        <StationList
          stations={inCity}
          showDistrict={allDistricts}
          visible={visible}
          isPending={isPending}
          search={search}
          onSearch={setSearch}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hidden={!!selected}
        />
        {selected ? (
          <StationDetail
            station={selected}
            editable={editable}
            onBack={() => setSelectedId(null)}
            onEdit={() => setStationForm(stationToForm(selected, editableCities))}
            onDeactivate={() => setConfirmDeactivate(true)}
            onAddTruck={() => setTruckForm(truckToForm(null))}
            onEditTruck={(t) => setTruckForm(truckToForm(t))}
          />
        ) : (
          <div className='hidden rounded-lg border border-dashed lg:block'>
            <EmptyState icon={Truck} title='Select a station'>
              Its details and vehicle inventory appear here. The bar beside each station shows its trucks by status.
            </EmptyState>
          </div>
        )}
      </div>

      <StationFormDialog
        initial={stationForm}
        district={stationForm?.id ? selectedDistrict : district}
        editableCities={editableCities}
        onClose={() => setStationForm(null)}
        onSaved={(saved) => setSelectedId(saved.id)}
      />
      <TruckFormDialog initial={truckForm} stationId={selectedId} onClose={() => setTruckForm(null)} />

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title={`Deactivate ${selected?.name}?`}
        description='It disappears from lists and running cards. Past incidents keep it.'
        confirmLabel='Deactivate'
        destructive
        onConfirm={() => deactivateStation(selected.id)}
      />
    </Page>
  );
}

export default StationsPage;
