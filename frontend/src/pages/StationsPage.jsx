import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Page from "@/components/common/Page.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import StationList from "@/components/features/stations/StationList.jsx";
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
  const [districtId, setDistrictId] = useState(user.districtId ?? 1);
  const { data: stations = [], isPending } = useGetStations(districtId);
  const { mutate: deactivateStation } = useDeactivateStation();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [stationForm, setStationForm] = useState(null);
  const [truckForm, setTruckForm] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const district = districts.find((d) => d.id === districtId);
  const selected = stations.find((s) => s.id === selectedId);
  const editableCities = (district?.cities ?? []).filter((c) => canEditCity(user, c.id));
  const canAddHere = editableCities.length > 0;
  const editable = !!selected && canEditCity(user, selected.cityId); // the selected station
  const visible = useMemo(() => stations.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())), [stations, search]);

  const pickDistrict = (id) => {
    setDistrictId(id);
    setSelectedId(null);
  };

  return (
    <Page
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
            className='w-full bg-card sm:w-72'
            options={districts.map((d) => ({ value: d.id, label: districtName(d) }))}
          />
          {canAddHere && (
            <Button onClick={() => setStationForm(stationToForm(null, editableCities))}>
              <Plus /> Add station
            </Button>
          )}
        </>
      }
    >
      {/* Fixed list column; the detail column may shrink (minmax(0,…)) so long call signs scroll inside it instead of resizing the layout. */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]'>
        {/* On small screens the list and the detail take turns. */}
        <StationList
          stations={stations}
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
          <Card className='hidden min-h-64 items-center justify-center text-sm text-muted-foreground lg:flex'>Select a station to see its trucks.</Card>
        )}
      </div>

      <StationFormDialog
        initial={stationForm}
        district={district}
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
