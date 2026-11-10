import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { alarmTone } from "@/utils/alarm.js";
import { TRUCK_TYPES } from "@/constants/truck.js";
import { RUNNING_CARD_TRUCK_TYPES, SPECIAL_TRUCK_TYPES } from "@shared/validation";
import useGetSettings from "@/hooks/settings/useGetSettings.js";

function TypeList({ types }) {
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {types.map((t) => (
        <li key={t} className='rounded-md border bg-card px-2 py-0.5 text-sm'>
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
    <section className='grid gap-3'>
      <h2 className='text-lg font-semibold'>How alarm levels work</h2>
      <Card className='gap-4 px-5 py-5'>
        <p className='text-sm leading-relaxed'>
          Stations are ranked by distance from the fire. Each alarm level takes the next {settings ? <b>{settings.stationsPerAlarm}</b> : "few"} nearest
          stations not yet on the incident{settings && <> within {settings.maxDistanceKm} km</>}, and each station sends one available truck. Raising the
          alarm sends the next group; closing the incident returns every truck to Available.
        </p>
        {settings && (
          <ol className='flex flex-wrap gap-1.5' aria-label='Alarm levels'>
            {settings.alarmLevels.map((level, i) => (
              <li key={level} className={cn("rounded-md px-2 py-0.5 font-condensed text-sm font-semibold", alarmTone(i))}>
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
      </Card>
    </section>
  );
}

export default AlarmGuide;
