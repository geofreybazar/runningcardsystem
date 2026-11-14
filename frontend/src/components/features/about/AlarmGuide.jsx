import Panel from "@/components/common/Panel.jsx";
import { cn } from "@/lib/utils";
import { alarmTone } from "@/utils/alarm.js";
import { TRUCK_TYPES } from "@/constants/truck.js";
import { RUNNING_CARD_TRUCK_TYPES, SPECIAL_TRUCK_TYPES } from "@shared/validation";
import useGetSettings from "@/hooks/settings/useGetSettings.js";

function TypeList({ types }) {
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {types.map((t) => (
        <li key={t} className='rounded-sm border bg-card px-2 py-0.5 text-sm'>
          {TRUCK_TYPES[t]}
        </li>
      ))}
    </ul>
  );
}

/** How alarm levels and truck types work; the live levels and numbers only when signed in (the settings need a sign-in). */
function AlarmGuide({ signedIn }) {
  const { data: settings } = useGetSettings({ enabled: signedIn });
  return (
    <Panel title='How alarm levels work' bodyClassName='grid gap-4 p-4'>
        <p className='text-sm leading-relaxed'>
          Stations are ranked by road distance from the fire (the driving route, not a straight line). Each alarm level takes the next {settings ? <b>{settings.stationsPerAlarm}</b> : "few"} nearest
          stations{settings && <> within {settings.maxDistanceKm} km by road</>}, and each station sends one available truck. Raising the
          alarm sends the next group: stations of the fire&apos;s own city send another truck while they are among the nearest, and stations from other
          cities that already responded are skipped. Closing the incident returns every truck to Available.
        </p>
        {settings && (
          <ol className='flex flex-wrap gap-1.5' aria-label='Alarm levels'>
            {settings.alarmLevels.map((level, i) => (
              <li key={level} className={cn("rounded-sm px-2 py-0.5 font-data text-sm font-semibold", alarmTone(i))}>
                {level}
              </li>
            ))}
          </ol>
        )}
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='grid gap-2'>
            <h3 className='text-sm font-semibold'>On the running card</h3>
            <TypeList types={RUNNING_CARD_TRUCK_TYPES} />
          </div>
          <div className='grid gap-2'>
            <h3 className='text-sm font-semibold'>Special units, sent on request</h3>
            <TypeList types={SPECIAL_TRUCK_TYPES} />
          </div>
        </div>
    </Panel>
  );
}

export default AlarmGuide;
