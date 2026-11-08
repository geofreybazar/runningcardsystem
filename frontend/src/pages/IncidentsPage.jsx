import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Page from "@/components/common/Page.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import IncidentCard from "@/components/features/incidents/list/IncidentCard.jsx";
import IncidentsTable from "@/components/features/incidents/list/IncidentsTable.jsx";
import useGetIncidents from "@/hooks/incidents/useGetIncidents.js";

function IncidentsPage() {
  const [status, setStatus] = useState("OPEN");
  const navigate = useNavigate();
  const { data: incidents, isPending } = useGetIncidents(status);

  const open = (i) => navigate(`/incidents/${i.id}`);
  const placeholder = isPending ? (
    <ListSkeleton className='p-3' />
  ) : (
    incidents?.length === 0 && <p className='py-10 text-center text-sm text-muted-foreground'>No {status.toLowerCase()} incidents.</p>
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
          <IncidentCard key={i.id} incident={i} onOpen={() => open(i)} />
        ))}
      </div>

      <Card className='hidden py-0 md:block'>{placeholder || <IncidentsTable incidents={incidents} status={status} onOpen={open} />}</Card>
    </Page>
  );
}

export default IncidentsPage;
