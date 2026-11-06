import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Page from "@/components/Page.jsx";
import { api } from "@/api/client.js";

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

function AlarmBadge({ incident }) {
  return incident.status === "OPEN" ? <Badge>{incident.alarmLevel}</Badge> : <Badge variant='secondary'>{incident.alarmLevel}</Badge>;
}

function IncidentsPage() {
  const [status, setStatus] = useState("OPEN");
  const [incidents, setIncidents] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIncidents(null);
    api(`/incidents?status=${status}`)
      .then(setIncidents)
      .catch((e) => toast.error(e.message));
  }, [status]);

  const open = (i) => navigate(`/incidents/${i.id}`);
  const empty = incidents?.length === 0 && (
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
        {empty}
        {incidents?.map((i) => (
          <Card key={i.id} className='cursor-pointer gap-1 px-4 py-3' onClick={() => open(i)}>
            <div className='flex items-center justify-between gap-2'>
              <span className='truncate font-medium'>{i.locationLabel}</span>
              <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
            </div>
            <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              <AlarmBadge incident={i} />
              {fmt(i.createdAt)} · {i._count.units} units · {i.createdBy.fullName}
            </div>
          </Card>
        ))}
      </div>

      <Card className='hidden py-0 md:block'>
        {empty || (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispatched</TableHead>
                <TableHead>Location</TableHead>
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
                  <TableCell>
                    <AlarmBadge incident={i} />
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>{i._count.units}</TableCell>
                  <TableCell>{i.createdBy.fullName}</TableCell>
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
