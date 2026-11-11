import { districtName } from "@/utils/permissions.js";
import { isStraightLine } from "@/utils/distance.js";

/** At a glance: how much help is in range, how close the nearest is (by road; ≈ = straight-line fallback), and which districts it comes from. */
function CardSummary({ runningCard }) {
  const stations = runningCard.flatMap((a) => a.stations);
  const trucks = stations.reduce((n, s) => n + s.trucks.length, 0);
  const nearest = stations.reduce((a, b) => (b.distance < a.distance ? b : a));
  const districts = [...new Map(stations.map((s) => [s.district.code, s.district])).values()].sort((a, b) => a.code - b.code);
  const figures = [
    ["Alarm levels", runningCard.length],
    ["Stations", stations.length],
    ["Trucks available", trucks],
    ["Nearest", `${isStraightLine(nearest) ? "≈" : ""}${nearest.distance.toFixed(1)} km`],
  ];
  return (
    <div className='border-b'>
      <dl className='grid grid-cols-4 divide-x'>
        {figures.map(([label, value]) => (
          <div key={label} className='px-3 py-2'>
            <dt className='truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase'>{label}</dt>
            <dd className='font-data text-xl leading-tight font-semibold'>{value}</dd>
          </div>
        ))}
      </dl>
      <ul className='flex flex-wrap gap-x-3 gap-y-1 border-t px-4 py-1.5 text-xs text-muted-foreground' aria-label='Districts on this card'>
        {districts.map((d) => (
          <li key={d.code} className='flex items-center gap-1.5'>
            <span className='size-2 rounded-[2px]' style={{ background: d.color }} aria-hidden='true' />
            {districtName(d)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CardSummary;
