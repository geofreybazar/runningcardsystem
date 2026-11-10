import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import Elapsed from "@/components/common/Elapsed.jsx";
import useGetIncidents from "@/hooks/incidents/useGetIncidents.js";
import Section from "./Section.jsx";
import Empty from "./Empty.jsx";

/** Open incidents our office is involved in (fire in our area, or our trucks responding), with how long they have run. */
function OpenIncidents() {
  const { data: incidents, isPending } = useGetIncidents("OPEN");
  return (
    <Section title='Open incidents' meta={incidents ? `${incidents.length} involving your area` : null}>
      {isPending && <ListSkeleton rows={2} className='p-3' />}
      {incidents?.length === 0 && <Empty>No open incidents involve your area.</Empty>}
      <ul className='divide-y'>
        {incidents?.map((i) => (
          <li key={i.id}>
            <Link to={`/incidents/${i.id}`} className='flex items-center gap-3 border-l-[3px] border-l-danger px-3 py-2.5 hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <AlarmBadge level={i.alarmLevel} index={i.alarmIndex} />
                  <span className='ml-auto font-data text-base'>
                    <Elapsed from={i.createdAt} />
                  </span>
                </div>
                <div className='mt-1 truncate text-sm font-medium'>{i.locationLabel}</div>
                <div className='text-xs text-muted-foreground'>
                  {i.city?.name} · {i._count.units} units
                </div>
              </div>
              <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default OpenIncidents;
