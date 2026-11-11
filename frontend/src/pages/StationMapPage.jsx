import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Page from "@/components/common/Page.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import { Skeleton } from "@/components/ui/skeleton";
import StationMap from "@/components/features/stations/StationMap.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import useGetStations from "@/hooks/stations/useGetStations.js";
import { districtName } from "@/utils/permissions.js";
import { searchStations, stationMapSummary } from "@/utils/stationMap.js";

/** Every fire station on one map, coloured by district; hover a pin for the station's details and trucks. */
function StationMapPage() {
  const { user } = useAuth();
  const { data: districts = [] } = useGetDistricts();
  // Like Stations & Trucks: regional accounts open on the whole region, district and city offices on their district.
  const [districtId, setDistrictId] = useState(user.districtId ?? "ALL");
  const [search, setSearch] = useState("");
  const { data: stations = [], isPending } = useGetStations(districtId);
  const visible = useMemo(() => searchStations(stations, search), [stations, search]);

  return (
    <Page
      className='lg:h-[calc(100svh-3rem)] lg:overflow-hidden'
      title='Station Map'
      description={isPending ? "Loading stations…" : stationMapSummary(visible)}
      actions={
        <>
          <div className='relative w-full sm:w-56'>
            <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input className='bg-card pl-8' placeholder='Search stations' aria-label='Search stations' value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SimpleSelect
            value={districtId}
            onChange={setDistrictId}
            className='w-full bg-card sm:w-64'
            aria-label='Fire district'
            options={[{ value: "ALL", label: "All districts" }, ...districts.map((d) => ({ value: d.id, label: districtName(d) }))]}
          />
        </>
      }
    >
      {isPending ? <Skeleton className='h-[65svh] w-full lg:h-auto lg:flex-1' /> : <StationMap stations={visible} />}
    </Page>
  );
}

export default StationMapPage;
