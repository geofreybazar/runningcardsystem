import MapComponent from "@/components/common/MapComponent.jsx";
import { TRUCK_STATUS, TRUCK_TYPES } from "@/constants/truck.js";
import { districtName } from "@/utils/permissions.js";
import { stationMarkers } from "@/utils/stationMap.js";

const LABELS = { types: TRUCK_TYPES, statuses: TRUCK_STATUS };

/** Every listed station as a pin in its district colour; hover (or tap) a pin for its details and trucks. */
function StationMap({ stations }) {
  const districts = [...new Map(stations.map((s) => [s.district.code, s.district])).values()].sort((a, b) => a.code - b.code);
  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border'>
      <div className='h-[65svh] lg:h-auto lg:min-h-0 lg:flex-1'>
        <MapComponent position={null} markers={stationMarkers(stations, LABELS)} />
      </div>
      <ul className='flex flex-wrap gap-x-3 gap-y-1 border-t bg-card px-3 py-1.5 text-xs text-muted-foreground' aria-label='Map legend'>
        {districts.map((d) => (
          <li key={d.code} className='flex items-center gap-1.5'>
            <span className='size-2.5 rounded-full' style={{ background: d.color }} aria-hidden='true' />
            {districtName(d)}
          </li>
        ))}
        <li className='flex items-center gap-1.5'>
          <span className='size-2.5 rounded-full bg-muted-foreground' aria-hidden='true' />
          No available truck
        </li>
      </ul>
    </div>
  );
}

export default StationMap;
