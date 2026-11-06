import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import MapComponent from "../components/MapComponent.jsx";
import { OWNERSHIP, TRUCK_STATUS, TRUCK_TYPES } from "../labels.js";

const EMPTY_TRUCK = { callSign: "", plateNumber: "", type: "ENGINE", waterCapacityLiters: "", ownership: "BFP" };

const canEditDistrict = (user, districtId) =>
  user.role === "SUPER_ADMIN" || (user.role === "OPERATIONS" && user.districtId === districtId);

const nullIfBlank = (v) => (v === "" || v == null ? null : v);

function StationsPage() {
  const { user } = useAuth();
  const [districts, setDistricts] = useState([]);
  const [districtId, setDistrictId] = useState(user.role === "OPERATIONS" ? user.districtId : 1);
  const [stations, setStations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [stationForm, setStationForm] = useState(null);
  const [truckForm, setTruckForm] = useState(null);
  const [formError, setFormError] = useState("");

  const district = districts.find((d) => d.id === districtId);
  const editable = canEditDistrict(user, districtId);
  const selected = stations.find((s) => s.id === selectedId);
  const visible = useMemo(
    () => stations.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [stations, search]
  );

  const load = useCallback(
    () => api(`/stations?districtId=${districtId}`).then(setStations).catch((e) => setError(e.message)),
    [districtId]
  );
  useEffect(() => {
    api("/districts").then(setDistricts).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setSelectedId(null);
    load();
  }, [load]);

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const saveStation = async () => {
    setFormError("");
    const f = stationForm;
    if (!f.lat) return setFormError("Click the map to place the station.");
    const body = {
      name: f.name.trim(),
      lat: f.lat,
      lng: f.lng,
      cityId: nullIfBlank(f.cityId),
      address: nullIfBlank(f.address?.trim()),
      contactNumber: nullIfBlank(f.contactNumber?.trim()),
    };
    try {
      const saved = f.id
        ? await api(`/stations/${f.id}`, { method: "PATCH", body })
        : await api("/stations", { method: "POST", body: { ...body, districtId } });
      setStationForm(null);
      await load();
      setSelectedId(saved.id);
    } catch (e) {
      setFormError(e.message);
    }
  };

  const saveTruck = async () => {
    setFormError("");
    const f = truckForm;
    const body = {
      callSign: f.callSign.trim(),
      plateNumber: nullIfBlank(f.plateNumber?.trim()),
      type: f.type,
      ownership: f.ownership,
      waterCapacityLiters: f.waterCapacityLiters === "" ? null : Number(f.waterCapacityLiters),
    };
    try {
      if (f.id) await api(`/trucks/${f.id}`, { method: "PATCH", body });
      else await api(`/stations/${selectedId}/trucks`, { method: "POST", body });
      setTruckForm(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    }
  };

  const openStationForm = (s) => {
    setFormError("");
    setStationForm(
      s
        ? { ...s, cityId: s.cityId ?? "", address: s.address ?? "", contactNumber: s.contactNumber ?? "" }
        : { name: "", cityId: district?.cities.length === 1 ? district.cities[0].id : "", address: "", contactNumber: "", lat: null, lng: null }
    );
  };

  return (
    <div className='flex flex-col gap-4 p-4 lg:p-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <h1 className='text-xl font-semibold'>Stations & Trucks</h1>
        <Select size='small' value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
          {districts.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
              {d.alias ? ` (${d.alias})` : ""}
            </MenuItem>
          ))}
        </Select>
        <div className='flex-1' />
        {editable && (
          <Button variant='contained' onClick={() => openStationForm(null)}>
            Add station
          </Button>
        )}
      </div>
      {error && <Alert severity='error' onClose={() => setError("")}>{error}</Alert>}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,1fr)_2fr]'>
        <Paper variant='outlined' className='flex max-h-[70vh] flex-col'>
          <div className='p-2'>
            <TextField size='small' fullWidth placeholder={`Search ${stations.length} stations`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <List dense className='overflow-auto'>
            {visible.map((s) => {
              const available = s.trucks.filter((t) => t.status === "AVAILABLE").length;
              return (
                <ListItemButton key={s.id} selected={s.id === selectedId} onClick={() => setSelectedId(s.id)}>
                  <ListItemText
                    primary={s.name}
                    secondary={`${s.city?.name ?? "No city set"} · ${available}/${s.trucks.length} trucks available`}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>

        {selected ? (
          <Paper variant='outlined' className='flex flex-col gap-4 p-4'>
            <div className='flex items-start gap-2'>
              <div className='flex-1'>
                <div className='text-lg font-semibold'>{selected.name}</div>
                <div className='text-sm text-gray-600'>
                  {[selected.city?.name, selected.address, selected.contactNumber].filter(Boolean).join(" · ") || "No details yet"}
                </div>
                <div className='font-mono text-xs text-gray-500'>
                  {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
                </div>
              </div>
              {editable && (
                <>
                  <Button startIcon={<EditIcon />} onClick={() => openStationForm(selected)}>
                    Edit
                  </Button>
                  <Button color='error' onClick={() => run(() => api(`/stations/${selected.id}`, { method: "PATCH", body: { isActive: false } }))}>
                    Deactivate
                  </Button>
                </>
              )}
            </div>

            <div className='flex items-center justify-between'>
              <div className='font-semibold'>Trucks</div>
              {editable && (
                <Button size='small' variant='outlined' onClick={() => { setFormError(""); setTruckForm(EMPTY_TRUCK); }}>
                  Add truck
                </Button>
              )}
            </div>
            {selected.trucks.length === 0 ? (
              <Alert severity='warning'>No trucks. This station is skipped on running cards until a truck is added.</Alert>
            ) : (
              <div className='overflow-x-auto'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Call sign</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Plate</TableCell>
                      <TableCell>Water (L)</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Status</TableCell>
                      {editable && <TableCell />}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selected.trucks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.callSign}</TableCell>
                        <TableCell>{TRUCK_TYPES[t.type]}</TableCell>
                        <TableCell>{t.plateNumber ?? "—"}</TableCell>
                        <TableCell>{t.waterCapacityLiters ?? "—"}</TableCell>
                        <TableCell>{OWNERSHIP[t.ownership]}</TableCell>
                        <TableCell>
                          {editable ? (
                            <Select
                              size='small'
                              value={t.status}
                              onChange={(e) => run(() => api(`/trucks/${t.id}`, { method: "PATCH", body: { status: e.target.value } }))}
                            >
                              {Object.entries(TRUCK_STATUS).map(([k, v]) => (
                                <MenuItem key={k} value={k}>
                                  {v.label}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Chip size='small' color={TRUCK_STATUS[t.status].color} label={TRUCK_STATUS[t.status].label} />
                          )}
                        </TableCell>
                        {editable && (
                          <TableCell align='right' className='whitespace-nowrap'>
                            <Tooltip title='Edit'>
                              <IconButton size='small' onClick={() => { setFormError(""); setTruckForm({ ...EMPTY_TRUCK, ...t, plateNumber: t.plateNumber ?? "", waterCapacityLiters: t.waterCapacityLiters ?? "" }); }}>
                                <EditIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Remove'>
                              <IconButton size='small' color='error' onClick={() => run(() => api(`/trucks/${t.id}`, { method: "DELETE" }))}>
                                <DeleteIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Paper>
        ) : (
          <Paper variant='outlined' className='p-10 text-center text-gray-500'>
            Select a station to see its trucks.
          </Paper>
        )}
      </div>

      <Dialog open={!!stationForm} onClose={() => setStationForm(null)} fullWidth maxWidth='md'>
        <DialogTitle>{stationForm?.id ? "Edit station" : `Add station to ${district?.name}`}</DialogTitle>
        {stationForm && (
          <DialogContent className='grid grid-cols-1 gap-4 md:grid-cols-2' sx={{ pt: "8px !important" }}>
            <div className='flex flex-col gap-4'>
              {formError && <Alert severity='error'>{formError}</Alert>}
              <TextField label='Station name' value={stationForm.name} onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })} />
              <TextField select label='City' value={stationForm.cityId} onChange={(e) => setStationForm({ ...stationForm, cityId: e.target.value })}>
                {district?.cities.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label='Address' value={stationForm.address} onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })} />
              <TextField label='Contact number' value={stationForm.contactNumber} onChange={(e) => setStationForm({ ...stationForm, contactNumber: e.target.value })} />
              <div className='font-mono text-sm text-gray-600'>
                {stationForm.lat ? `${stationForm.lat.toFixed(6)}, ${stationForm.lng.toFixed(6)}` : "Click the map to place the station"}
              </div>
            </div>
            <div className='h-80 overflow-hidden rounded border md:h-full md:min-h-80'>
              <MapComponent
                position={stationForm.lat ? { lat: stationForm.lat, lng: stationForm.lng } : null}
                onChange={(p) => setStationForm((f) => ({ ...f, lat: p.lat, lng: p.lng }))}
              />
            </div>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setStationForm(null)}>Cancel</Button>
          <Button variant='contained' onClick={saveStation}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!truckForm} onClose={() => setTruckForm(null)} fullWidth maxWidth='xs'>
        <DialogTitle>{truckForm?.id ? "Edit truck" : "Add truck"}</DialogTitle>
        {truckForm && (
          <DialogContent className='flex flex-col gap-4' sx={{ pt: "8px !important" }}>
            {formError && <Alert severity='error'>{formError}</Alert>}
            <TextField label='Call sign' value={truckForm.callSign} onChange={(e) => setTruckForm({ ...truckForm, callSign: e.target.value })} />
            <TextField select label='Type' value={truckForm.type} onChange={(e) => setTruckForm({ ...truckForm, type: e.target.value })}>
              {Object.entries(TRUCK_TYPES).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
            <TextField label='Plate number' value={truckForm.plateNumber} onChange={(e) => setTruckForm({ ...truckForm, plateNumber: e.target.value })} />
            <TextField
              label='Water capacity (liters)'
              type='number'
              value={truckForm.waterCapacityLiters}
              onChange={(e) => setTruckForm({ ...truckForm, waterCapacityLiters: e.target.value })}
            />
            <TextField select label='Owner' value={truckForm.ownership} onChange={(e) => setTruckForm({ ...truckForm, ownership: e.target.value })}>
              {Object.entries(OWNERSHIP).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setTruckForm(null)}>Cancel</Button>
          <Button variant='contained' onClick={saveTruck}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default StationsPage;
