import { useState } from "react";
import { LoaderCircle, ScrollText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Page from "@/components/common/Page.jsx";
import Panel from "@/components/common/Panel.jsx";
import Toolbar from "@/components/common/Toolbar.jsx";
import EmptyState from "@/components/common/EmptyState.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import AuditTable from "@/components/features/auditLog/AuditTable.jsx";
import useGetAuditLogs from "@/hooks/auditLogs/useGetAuditLogs.js";
import { ACTION_LABELS, AUDIT_ENTITIES } from "@/constants/audit.js";
import { auditDetails } from "@/utils/audit.js";
import { displayName } from "@/utils/person.js";

/** Chronological record. The kind filter is applied by the API; the search narrows the entries loaded so far. */
function AuditLogPage() {
  const [entity, setEntity] = useState("ALL");
  const [query, setQuery] = useState("");
  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useGetAuditLogs(entity);
  const rows = data?.pages.flat() ?? [];
  const q = query.trim().toLowerCase();
  const shown = q
    ? rows.filter((r) => [r.user && displayName(r.user), ACTION_LABELS[r.action] ?? r.action, auditDetails(r)].join(" ").toLowerCase().includes(q))
    : rows;

  return (
    <Page title='Audit Log' description='Sign-ins, dispatches, and every change to accounts, stations, trucks, barangay pins and settings.'>
      <Toolbar end={!isPending && <span className='font-data text-base'>{q ? `${shown.length} of ${rows.length} loaded` : `${rows.length} loaded`}</span>}>
        <SimpleSelect
          value={entity}
          onChange={setEntity}
          className='w-44 bg-card'
          aria-label='Kind of record'
          options={[{ value: "ALL", label: "Everything" }, ...Object.entries(AUDIT_ENTITIES).map(([value, label]) => ({ value, label }))]}
        />
        <div className='relative w-full sm:w-72'>
          <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search who, action or details' aria-label='Search the audit log' className='bg-card pl-8' />
        </div>
      </Toolbar>
      <Panel flush>
        {isPending ? (
          <ListSkeleton rows={8} className='p-3' />
        ) : shown.length === 0 ? (
          <EmptyState icon={ScrollText} title={rows.length ? "Nothing matches among the loaded entries." : "No entries yet."}>
            {q && hasNextPage && "Load more to search further back."}
          </EmptyState>
        ) : (
          <AuditTable rows={shown} />
        )}
        {hasNextPage && (
          <div className='border-t p-3'>
            <Button variant='outline' className='w-full' onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage && <LoaderCircle className='animate-spin' />} Load more
            </Button>
          </div>
        )}
      </Panel>
    </Page>
  );
}

export default AuditLogPage;
