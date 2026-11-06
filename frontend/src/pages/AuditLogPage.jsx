import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Page from "@/components/Page.jsx";
import SimpleSelect from "@/components/SimpleSelect.jsx";
import { api } from "@/api/client.js";

const PAGE = 100;
const ENTITIES = ["User", "Station", "Truck", "Barangay", "Settings"];
const when = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

function AuditLogPage() {
  const [entity, setEntity] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [more, setMore] = useState(false);

  const fetchPage = (skip) =>
    api(`/audit-logs?take=${PAGE}&skip=${skip}${entity !== "ALL" ? `&entity=${entity}` : ""}`)
      .then((page) => {
        setRows((r) => (skip ? [...r, ...page] : page));
        setMore(page.length === PAGE);
      })
      .catch((e) => toast.error(e.message));

  useEffect(() => {
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the filter changes
  }, [entity]);

  return (
    <Page
      title='Audit log'
      description='Who changed accounts, stations, trucks, barangay pins and settings.'
      actions={
        <SimpleSelect
          value={entity}
          onChange={setEntity}
          className='w-44 bg-card'
          options={[{ value: "ALL", label: "Everything" }, ...ENTITIES.map((e) => ({ value: e, label: e }))]}
        />
      }
    >
      <Card className='py-0'>
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
                  <TableCell className='whitespace-nowrap'>{r.user.fullName}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{r.action}</Badge>
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {r.entity} <span className='text-muted-foreground'>#{r.entityId.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell className='max-w-md font-mono text-xs break-all whitespace-normal text-muted-foreground'>
                    {r.changes ? JSON.stringify(r.changes) : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      {more && (
        <Button variant='outline' className='self-center' onClick={() => fetchPage(rows.length)}>
          Load more
        </Button>
      )}
    </Page>
  );
}

export default AuditLogPage;
