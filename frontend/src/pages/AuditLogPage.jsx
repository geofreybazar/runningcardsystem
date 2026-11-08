import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Page from "@/components/Page.jsx";
import SimpleSelect from "@/components/SimpleSelect.jsx";
import ListSkeleton from "@/components/ListSkeleton.jsx";
import { displayName } from "@/lib/person.js";
import { api } from "@/api/client.js";
import { ACTION_LABELS, AUDIT_ENTITIES, WARNING_ACTIONS, auditDetails } from "@/lib/audit.js";

const PAGE = 100;
const when = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

function AuditLogPage() {
  const [entity, setEntity] = useState("ALL");
  // Offset pages; the next one starts after every row loaded so far.
  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["audit", entity],
    queryFn: ({ pageParam }) => api(`/audit-logs?take=${PAGE}&skip=${pageParam}${entity !== "ALL" ? `&entity=${entity}` : ""}`),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length === PAGE ? pages.length * PAGE : undefined),
  });
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
      {isPending && <ListSkeleton rows={8} />}
      <Card className={isPending ? "hidden" : "py-0"}>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>What</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className='align-top'>
                  <TableCell className='whitespace-nowrap text-muted-foreground'>{when(r.createdAt)}</TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {r.user ? displayName(r.user) : <span className='text-muted-foreground'>Unknown account</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={WARNING_ACTIONS.has(r.action) ? "destructive" : "outline"}>{ACTION_LABELS[r.action] ?? r.action}</Badge>
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {AUDIT_ENTITIES[r.entity] ?? r.entity} <span className='text-muted-foreground'>#{r.entityId.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell className='max-w-md text-xs break-words whitespace-normal text-muted-foreground'>{auditDetails(r)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      {hasNextPage && (
        <Button variant='outline' className='self-center' onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage && <LoaderCircle className='animate-spin' />} Load more
        </Button>
      )}
    </Page>
  );
}

export default AuditLogPage;
