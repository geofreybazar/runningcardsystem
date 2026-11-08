import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Page from "@/components/common/Page.jsx";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import AuditTable from "@/components/features/auditLog/AuditTable.jsx";
import useGetAuditLogs from "@/hooks/auditLogs/useGetAuditLogs.js";
import { AUDIT_ENTITIES } from "@/constants/audit.js";

function AuditLogPage() {
  const [entity, setEntity] = useState("ALL");
  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useGetAuditLogs(entity);
  const rows = data?.pages.flat() ?? [];

  return (
    <Page
      title='Audit log'
      description='Sign-ins, dispatches, and every change to accounts, stations, trucks, barangay pins and settings.'
      actions={
        <SimpleSelect
          value={entity}
          onChange={setEntity}
          className='w-44 bg-card'
          options={[{ value: "ALL", label: "Everything" }, ...Object.entries(AUDIT_ENTITIES).map(([value, label]) => ({ value, label }))]}
        />
      }
    >
      {isPending ? <ListSkeleton rows={8} /> : <AuditTable rows={rows} />}
      {hasNextPage && (
        <Button variant='outline' className='self-center' onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage && <LoaderCircle className='animate-spin' />} Load more
        </Button>
      )}
    </Page>
  );
}

export default AuditLogPage;
