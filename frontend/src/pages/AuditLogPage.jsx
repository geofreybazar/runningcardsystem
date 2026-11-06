import { useEffect, useState } from "react";
import { Alert, Button, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { api } from "../api/client.js";

const PAGE = 100;
const ENTITIES = ["User", "Station", "Truck", "Barangay", "Settings"];

function AuditLogPage() {
  const [entity, setEntity] = useState("");
  const [rows, setRows] = useState([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = (skip) =>
    api(`/audit-logs?take=${PAGE}&skip=${skip}${entity ? `&entity=${entity}` : ""}`).then((page) => {
      setRows((r) => (skip ? [...r, ...page] : page));
      setMore(page.length === PAGE);
    });

  useEffect(() => {
    fetchPage(0).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the filter changes
  }, [entity]);

  return (
    <div className='flex flex-col gap-4 p-4 lg:p-6'>
      <div className='flex items-center gap-3'>
        <h1 className='text-xl font-semibold'>Audit log</h1>
        <Select size='small' displayEmpty value={entity} onChange={(e) => setEntity(e.target.value)}>
          <MenuItem value=''>Everything</MenuItem>
          {ENTITIES.map((e) => (
            <MenuItem key={e} value={e}>
              {e}
            </MenuItem>
          ))}
        </Select>
      </div>
      {error && <Alert severity='error'>{error}</Alert>}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Who</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>What</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='whitespace-nowrap'>{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell>{r.user.fullName}</TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell>
                  {r.entity} #{r.entityId.slice(0, 8)}
                </TableCell>
                <TableCell className='max-w-md break-all font-mono text-xs'>{r.changes ? JSON.stringify(r.changes) : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {more && (
        <Button onClick={() => fetchPage(rows.length).catch((e) => setError(e.message))} className='self-center'>
          Load more
        </Button>
      )}
    </div>
  );
}

export default AuditLogPage;
