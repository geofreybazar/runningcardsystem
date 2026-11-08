import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import AlarmBadge from "@/components/common/AlarmBadge.jsx";
import useGetIncidents from "@/hooks/incidents/useGetIncidents.js";
import { formatDateTime } from "@/utils/dateTime.js";
import Section from "./Section.jsx";
import Empty from "./Empty.jsx";

/** Open incidents our office is involved in (fire in our area, or our trucks responding). */
function OpenIncidents() {
  const { data: incidents, isPending } = useGetIncidents("OPEN");
  return (
    <Section title='Open incidents involving us'>
      {isPending && <ListSkeleton rows={2} />}
      {incidents?.length === 0 && <Empty>No open incidents involve your area.</Empty>}
      {incidents?.map((i) => (
        <Link key={i.id} to={`/incidents/${i.id}`}>
          <Card className='gap-1 border-l-4 border-l-primary px-4 py-3 transition-colors hover:bg-accent'>
            <div className='flex items-center justify-between gap-2'>
              <span className='truncate font-medium'>{i.locationLabel}</span>
              <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <AlarmBadge level={i.alarmLevel} index={i.alarmIndex} />
              <span className='text-sm'>{i.city?.name}</span>
              <span className='ml-auto font-condensed text-sm tabular-nums text-muted-foreground'>{i._count.units} units</span>
            </div>
            <div className='text-xs text-muted-foreground'>Dispatched {formatDateTime(i.createdAt)}</div>
          </Card>
        </Link>
      ))}
    </Section>
  );
}

export default OpenIncidents;
