import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Siren } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Page from "@/components/common/Page.jsx";
import Panel from "@/components/common/Panel.jsx";
import Toolbar from "@/components/common/Toolbar.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import EmptyState from "@/components/common/EmptyState.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import IncidentCard from "@/components/features/incidents/list/IncidentCard.jsx";
import IncidentsTable from "@/components/features/incidents/list/IncidentsTable.jsx";
import useGetIncidents from "@/hooks/incidents/useGetIncidents.js";

const ALL = "ALL";

/** Incident board: Open / Closed, narrowed by place or city, newest first. Filtering happens on the loaded list. */
function IncidentsPage() {
  const [status, setStatus] = useState("OPEN");
  const [query, setQuery] = useState("");
  const [cityId, setCityId] = useState(ALL);
  const navigate = useNavigate();
  const { data: incidents, isPending } = useGetIncidents(status);

  const cities = useMemo(
    () => [...new Map((incidents ?? []).filter((i) => i.city).map((i) => [i.cityId, i.city.name])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [incidents],
  );
  const q = query.trim().toLowerCase();
  const shown = (incidents ?? []).filter(
    (i) => (cityId === ALL || i.cityId === cityId) && (!q || i.locationLabel.toLowerCase().includes(q) || i.city?.name.toLowerCase().includes(q)),
  );
  const open = (i) => navigate(`/incidents/${i.id}`);

  const body = isPending ? (
    <ListSkeleton className='p-3' />
  ) : shown.length === 0 ? (
    <EmptyState icon={Siren} title={incidents?.length ? "No incidents match the filters." : `No ${status.toLowerCase()} incidents.`}>
      {status === "OPEN" && !incidents?.length && "New dispatches appear here at once."}
    </EmptyState>
  ) : null;

  return (
    <Page title='Incidents'>
      <Toolbar
        end={
          incidents && (
            <span className='font-data text-base'>
              {shown.length === incidents.length ? incidents.length : `${shown.length} of ${incidents.length}`} {status.toLowerCase()}
            </span>
          )
        }
      >
        <Tabs value={status} onValueChange={(s) => (setStatus(s), setCityId(ALL))}>
          <TabsList>
            <TabsTrigger value='OPEN'>Open</TabsTrigger>
            <TabsTrigger value='CLOSED'>Closed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className='relative w-full sm:w-72'>
          <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search location or city' aria-label='Search incidents' className='bg-card pl-8' />
        </div>
        <SimpleSelect
          value={cityId}
          onChange={setCityId}
          className='w-full bg-card sm:w-48'
          aria-label='City'
          options={[{ value: ALL, label: "All cities" }, ...cities.map(([value, label]) => ({ value, label }))]}
        />
      </Toolbar>

      <Panel flush>
        {body ?? (
          <>
            <ul className='divide-y md:hidden'>
              {shown.map((i) => (
                <IncidentCard key={i.id} incident={i} onOpen={() => open(i)} />
              ))}
            </ul>
            <div className='hidden md:block'>
              <IncidentsTable incidents={shown} onOpen={open} />
            </div>
          </>
        )}
      </Panel>
    </Page>
  );
}

export default IncidentsPage;
