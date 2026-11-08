import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Page from "@/components/Page.jsx";
import { displayName } from "@/lib/person.js";
import { api } from "@/api/client.js";
import ListSkeleton from "@/components/ListSkeleton.jsx";
import { AlarmBadge as Alarm } from "@/components/Alarm.jsx";

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

const AlarmBadge = ({ incident }) => <Alarm level={incident.alarmLevel} index={incident.alarmIndex} closed={incident.status !== "OPEN"} />;

function IncidentsPage() {
  const [status, setStatus] = useState("OPEN");
  const navigate = useNavigate();
  // Live notifications invalidate ["incidents"], so any dispatch, raise or close in my area reloads the list.
  const { data: incidents, isPending } = useQuery({ queryKey: ["incidents", status], queryFn: () => api(`/incidents?status=${status}`) });

  const open = (i) => navigate(`/incidents/${i.id}`);
  const placeholder = isPending ? (
    <ListSkeleton className='p-3' />
  ) : incidents?.length === 0 && (
    <p className='py-10 text-center text-sm text-muted-foreground'>No {status.toLowerCase()} incidents.</p>
  );

  return (
    <Page
      title='Incidents'
      actions={
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value='OPEN'>Open</TabsTrigger>
            <TabsTrigger value='CLOSED'>Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {/* Phones: tappable cards. Wider screens: a table. */}
      <div className='grid gap-2 md:hidden'>
        {placeholder}
        {incidents?.map((i) => (
          <Card key={i.id} className='cursor-pointer gap-1 px-4 py-3' onClick={() => open(i)}>
            <div className='flex items-center justify-between gap-2'>
              <span className='truncate font-medium'>{i.locationLabel}</span>
              <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <AlarmBadge incident={i} />
              <span className='text-sm'>{i.city?.name}</span>
              <span className='ml-auto font-condensed text-sm tabular-nums text-muted-foreground'>{i._count.units} units</span>
            </div>
            <div className='text-xs text-muted-foreground'>
              {fmt(i.createdAt)}, by {displayName(i.createdBy)}
            </div>
          </Card>
        ))}
      </div>

      <Card className='hidden py-0 md:block'>
        {placeholder || (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispatched</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Alarm</TableHead>
                <TableHead className='text-right'>Units</TableHead>
                <TableHead>By</TableHead>
                {status === "CLOSED" && <TableHead>Closed</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents?.map((i) => (
                <TableRow key={i.id} className='cursor-pointer' onClick={() => open(i)}>
                  <TableCell className='whitespace-nowrap text-muted-foreground'>{fmt(i.createdAt)}</TableCell>
                  <TableCell className='max-w-80 truncate font-medium'>{i.locationLabel}</TableCell>
                  <TableCell>{i.city?.name ?? "—"}</TableCell>
                  <TableCell>
                    <AlarmBadge incident={i} />
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>{i._count.units}</TableCell>
                  <TableCell>{displayName(i.createdBy)}</TableCell>
                  {status === "CLOSED" && <TableCell className='whitespace-nowrap text-muted-foreground'>{fmt(i.closedAt)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Page>
  );
}

export default IncidentsPage;
