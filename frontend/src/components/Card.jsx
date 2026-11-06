import FireTruckIcon from "@mui/icons-material/FireTruck";
import { Paper } from "@mui/material";

const DISTRICTS = {
  firedistrict1: { label: "District 1", color: "bg-orange-400" },
  firedistrict2: { label: "District 2", color: "bg-blue-500" },
  firedistrict3: { label: "District 3", color: "bg-yellow-500" },
  firedistrict4: { label: "District 4", color: "bg-red-600" },
  firedistrict5: { label: "District 5", color: "bg-green-500" },
};

function Card({ runningCard }) {
  if (!runningCard) {
    return (
      <Paper variant='outlined' className='p-10 text-center text-gray-500'>
        Search a location to generate the running card.
      </Paper>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap gap-4 text-sm'>
        {Object.entries(DISTRICTS).map(([key, d]) => (
          <span key={key} className='flex items-center gap-1'>
            <span className={`${d.color} inline-block h-3 w-3 rounded-full`} />
            {d.label}
          </span>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {runningCard.map((alarm, i) => (
          <Paper key={alarm.alarmLevel} variant='outlined' className='overflow-hidden'>
            <div
              className={`px-4 py-2 font-semibold text-white ${
                i < 5 ? "bg-red-700" : i < 9 ? "bg-gray-800" : "bg-black"
              }`}
            >
              {alarm.alarmLevel}
            </div>
            <ul className='divide-y'>
              {alarm.stations.map((station) => (
                <li key={station.name} className='flex items-center gap-3 px-4 py-2'>
                  <span
                    className={`${DISTRICTS[station.district]?.color ?? "bg-gray-300"} flex h-9 w-9 shrink-0 items-center justify-center rounded-full`}
                    title={DISTRICTS[station.district]?.label}
                  >
                    <FireTruckIcon fontSize='small' />
                  </span>
                  <span className='flex-1 text-sm font-medium uppercase'>{station.name}</span>
                  <span className='whitespace-nowrap text-sm text-gray-600'>
                    {station.distance.toFixed(2)} km
                  </span>
                </li>
              ))}
            </ul>
          </Paper>
        ))}
      </div>
    </div>
  );
}

export default Card;
