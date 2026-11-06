import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Chip, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs } from "@mui/material";
import { api } from "../api/client.js";

const fmt = (d) => new Date(d).toLocaleString();

function IncidentsPage() {
  const [status, setStatus] = useState("OPEN");
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setError("");
    api(`/incidents?status=${status}`).then(setIncidents).catch((e) => setError(e.message));
  }, [status]);

  return (
    <div className='flex flex-col gap-4 p-4 lg:p-6'>
      <h1 className='text-xl font-semibold'>Incidents</h1>
      <Tabs value={status} onChange={(_, v) => setStatus(v)}>
        <Tab value='OPEN' label='Open' />
        <Tab value='CLOSED' label='Closed' />
      </Tabs>
      {error && <Alert severity='error'>{error}</Alert>}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Dispatched</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Alarm</TableCell>
              <TableCell>Units</TableCell>
              <TableCell>By</TableCell>
              {status === "CLOSED" && <TableCell>Closed</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-center text-gray-500'>
                  No {status.toLowerCase()} incidents.
                </TableCell>
              </TableRow>
            )}
            {incidents.map((i) => (
              <TableRow key={i.id} hover className='cursor-pointer' onClick={() => navigate(`/incidents/${i.id}`)}>
                <TableCell className='whitespace-nowrap'>{fmt(i.createdAt)}</TableCell>
                <TableCell>{i.locationLabel}</TableCell>
                <TableCell>
                  <Chip size='small' color={i.status === "OPEN" ? "error" : "default"} label={i.alarmLevel} />
                </TableCell>
                <TableCell>{i._count.units}</TableCell>
                <TableCell>{i.createdBy.fullName}</TableCell>
                {status === "CLOSED" && <TableCell className='whitespace-nowrap'>{fmt(i.closedAt)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default IncidentsPage;
