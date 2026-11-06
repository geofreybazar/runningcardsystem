import FireTruckIcon from "@mui/icons-material/FireTruck";
import { MenuItem, Paper, Select } from "@mui/material";
import { TRUCK_TYPES } from "../labels.js";

const truckLabel = (t) => `${t.callSign} · ${TRUCK_TYPES[t.type]}`;

function Card({ runningCard, truckPicks = {}, onPickTruck, alarmIndex = -1 }) {
  if (!runningCard) {
    return (
      <Paper variant='outlined' className='p-10 text-center text-gray-500'>
        Search a location to generate the running card.
      </Paper>
    );
  }
  if (runningCard.length === 0) {
    return (
      <Paper variant='outlined' className='p-10 text-center text-gray-500'>
        No station with an available truck is within range.
      </Paper>
    );
  }

  const districts = new Map(runningCard.flatMap((a) => a.stations.map((s) => [s.district.code, s.district])));

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap gap-4 text-sm'>
        {[...districts.values()]
          .sort((a, b) => a.code - b.code)
          .map((d) => (
            <span key={d.code} className='flex items-center gap-1'>
              <span className='inline-block h-3 w-3 rounded-full' style={{ background: d.color }} />
              {d.name}
            </span>
          ))}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {runningCard.map((alarm, i) => (
          <Paper
            key={alarm.alarmLevel}
            variant='outlined'
            className={`overflow-hidden ${i <= alarmIndex ? "ring-2 ring-red-600" : ""}`}
          >
            <div className={`flex justify-between px-4 py-2 font-semibold text-white ${i < 5 ? "bg-red-700" : i < 9 ? "bg-gray-800" : "bg-black"}`}>
              <span>{alarm.alarmLevel}</span>
              {i <= alarmIndex && <span className='text-xs font-normal uppercase'>Dispatched</span>}
            </div>
            <ul className='divide-y'>
              {alarm.stations.map((station) => {
                const truckId = truckPicks[station.id] ?? station.trucks[0]?.id;
                return (
                  <li key={station.id} className='flex items-center gap-3 px-4 py-2'>
                    <span
                      className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full'
                      style={{ background: station.district.color }}
                      title={station.district.name}
                    >
                      <FireTruckIcon fontSize='small' />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <div className='text-sm font-medium uppercase'>{station.name}</div>
                      {onPickTruck && station.trucks.length > 1 && i > alarmIndex ? (
                        <Select
                          variant='standard'
                          value={truckId}
                          onChange={(e) => onPickTruck(station.id, e.target.value)}
                          sx={{ fontSize: 13 }}
                        >
                          {station.trucks.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {truckLabel(t)}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <div className='text-xs text-gray-600'>{truckLabel(station.trucks.find((t) => t.id === truckId) ?? station.trucks[0])}</div>
                      )}
                    </div>
                    <span className='whitespace-nowrap text-sm text-gray-600'>{station.distance.toFixed(2)} km</span>
                  </li>
                );
              })}
            </ul>
          </Paper>
        ))}
      </div>
    </div>
  );
}

export default Card;
