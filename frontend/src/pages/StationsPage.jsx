import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, MapPin, Pencil, Phone, Plus, Search, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Page from "@/components/Page.jsx";
import Field from "@/components/Field.jsx";
import SimpleSelect from "@/components/SimpleSelect.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import { TruckStatusBadge } from "@/components/StatusBadge.jsx";
import MapComponent from "@/components/MapComponent.jsx";
import { cn } from "@/lib/utils";
import { api } from "@/api/client.js";
import { useAuth } from "@/auth/AuthContext.jsx";
import { canEditCity, districtName } from "@/auth/permissions.js";

import { OWNERSHIP, TRUCK_STATUS, TRUCK_TYPES, toOptions } from "@/labels.js";
import { formErrors } from "@/lib/validation.js";
import { TRUCK_TYPES as ALLOWED_TRUCK_TYPES, createStationSchema, createTruckSchema } from "@shared/validation";

// Ambulance and Rescue are no longer offered; an existing truck of that type keeps showing it until edited.
const truckTypeOptions = (current) =>
  Object.keys(TRUCK_TYPES)
    .filter((t) => ALLOWED_TRUCK_TYPES.includes(t) || t === current)
    .map((t) => ({ value: t, label: TRUCK_TYPES[t] }));

const nullIfBlank = (v) => (v === "" || v == null ? null : v);

const stationBody = (f) => ({
  name: f.name.trim(),
  lat: f.lat ?? undefined,
  lng: f.lng ?? undefined,
  cityId: nullIfBlank(f.cityId) ?? undefined,
  address: nullIfBlank(f.address?.trim()),
  contactNumber: nullIfBlank(f.contactNumber?.trim()),
});

const truckBody = (f) => ({
  callSign: f.callSign.trim(),
  plateNumber: nullIfBlank(f.plateNumber?.trim()),
  type: f.type,
  ownership: f.ownership,
  waterCapacityLiters: f.waterCapacityLiters === "" ? null : Number(f.waterCapacityLiters),
});

const EMPTY_TRUCK = { callSign: "", plateNumber: "", type: "ENGINE", waterCapacityLiters: "", ownership: "BFP" };


function IconAction({ label, onClick, children, destructive }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='ghost' size='icon' className={cn("size-8", destructive && "text-destructive hover:text-destructive")} onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function StationsPage() {
  const { user } = useAuth();
  const [districts, setDistricts] = useState([]);
  const [districtId, setDistrictId] = useState(user.districtId ?? 1);
  const [stations, setStations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [stationForm, setStationForm] = useState(null);
  const [truckForm, setTruckForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [tried, setTried] = useState(false); // after the first Save attempt, errors follow the form as it is edited
  const [confirm, setConfirm] = useState(null); // { title, description, onConfirm }

  const district = districts.find((d) => d.id === districtId);
  const selected = stations.find((s) => s.id === selectedId);
  const editableCities = (district?.cities ?? []).filter((c) => canEditCity(user, c.id));
  const canAddHere = editableCities.length > 0;
  const editable = !!selected && canEditCity(user, selected.cityId); // the selected station
  const visible = useMemo(() => stations.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())), [stations, search]);

  const load = useCallback(
    () => api(`/stations?districtId=${districtId}`).then(setStations).catch((e) => toast.error(e.message)),
    [districtId]
  );
  useEffect(() => {
    api("/districts").then(setDistricts).catch((e) => toast.error(e.message));
  }, []);
  useEffect(() => {
    setSelectedId(null);
    load();
  }, [load]);

  const run = async (fn, success) => {
    try {
      await fn();
      if (success) toast.success(success);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const stationErrors = tried && stationForm ? formErrors(createStationSchema, stationBody(stationForm)) : null;
  const truckErrors = tried && truckForm ? formErrors(createTruckSchema, truckBody(truckForm)) : null;

  const saveStation = async () => {
    setFormError("");
    setTried(true);
    const f = stationForm;
    const body = stationBody(f);
    if (formErrors(createStationSchema, body)) return; // shown under the fields
    try {
      const saved = f.id
        ? await api(`/stations/${f.id}`, { method: "PATCH", body })
        : await api("/stations", { method: "POST", body });
      setStationForm(null);
      toast.success(f.id ? "Station updated" : "Station added");
      await load();
      setSelectedId(saved.id);
    } catch (e) {
      setFormError(e.message);
    }
  };

  const saveTruck = async () => {
    setFormError("");
    setTried(true);
    const f = truckForm;
    const body = truckBody(f);
    if (formErrors(createTruckSchema, body)) return; // shown under the fields
    try {
      if (f.id) await api(`/trucks/${f.id}`, { method: "PATCH", body });
      else await api(`/stations/${selectedId}/trucks`, { method: "POST", body });
      setTruckForm(null);
      toast.success(f.id ? "Truck updated" : "Truck added");
      await load();
    } catch (e) {
      setFormError(e.message);
    }
  };

  const openStationForm = (s) => {
    setFormError("");
    setTried(false);
    setStationForm(
      s
        ? { ...s, cityId: s.cityId ?? "", address: s.address ?? "", contactNumber: s.contactNumber ?? "" }
        : { name: "", cityId: editableCities.length === 1 ? editableCities[0].id : "", address: "", contactNumber: "", lat: null, lng: null }
    );
  };

  const openTruckForm = (t) => {
    setFormError("");
    setTried(false);
    setTruckForm(t ? { ...EMPTY_TRUCK, ...t, plateNumber: t.plateNumber ?? "", waterCapacityLiters: t.waterCapacityLiters ?? "" } : EMPTY_TRUCK);
  };

  const setStatus = (t, status) => run(() => api(`/trucks/${t.id}`, { method: "PATCH", body: { status } }), `${t.callSign}: ${TRUCK_STATUS[status].label}`);

  return (
    <Page
      title='Stations & Trucks'
      description={canAddHere ? undefined : "View only. Stations and trucks are maintained by each city's Operations office (Manila and Quezon City: their Fire District office)."}
      actions={
        <>
          <SimpleSelect
            value={districtId}
            onChange={setDistrictId}
            className='w-full bg-card sm:w-72'
            options={districts.map((d) => ({ value: d.id, label: districtName(d) }))}
          />
          {canAddHere && (
            <Button onClick={() => openStationForm(null)}>
              <Plus /> Add station
            </Button>
          )}
        </>
      }
    >
      {/* Fixed list column; the detail column may shrink (minmax(0,…)) so long call signs scroll inside it instead of resizing the layout. */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]'>
        {/* On small screens the list and the detail take turns. */}
        <Card className={cn("gap-0 py-0 lg:flex", selected && "hidden")}>
          <div className='border-b p-3'>
            <div className='relative'>
              <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input className='pl-8' placeholder={`Search ${stations.length} stations`} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <ul className='max-h-[65vh] divide-y overflow-auto'>
            {visible.map((s) => {
              const available = s.trucks.filter((t) => t.status === "AVAILABLE").length;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/60",
                      s.id === selectedId && "bg-accent shadow-[inset_3px_0_0_var(--primary)]"
                    )}
                  >
                    <div className='truncate text-sm font-medium'>{s.name}</div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      {s.city?.name ?? "No city set"}
                      <span className={cn("ml-auto tabular-nums", s.trucks.length && !available && "text-destructive")}>
                        {available}/{s.trucks.length} available
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected ? (
          <Card className='min-w-0 gap-4 px-4 py-4 md:px-6'>
            <button onClick={() => setSelectedId(null)} className='flex w-fit items-center gap-1 text-sm text-muted-foreground lg:hidden'>
              <ChevronLeft className='size-4' /> Stations
            </button>
            <div className='flex flex-wrap items-start gap-3'>
              <div className='min-w-0 flex-1'>
                <h2 className='text-lg font-semibold'>{selected.name}</h2>
                <div className='mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <MapPin className='size-3.5' />
                    {[selected.city?.name, selected.address].filter(Boolean).join(", ") || "No address"}
                  </span>
                  {selected.contactNumber && (
                    <span className='flex items-center gap-1'>
                      <Phone className='size-3.5' />
                      {selected.contactNumber}
                    </span>
                  )}
                </div>
              </div>
              {editable && (
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={() => openStationForm(selected)}>
                    <Pencil /> Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-destructive'
                    onClick={() =>
                      setConfirm({
                        title: `Deactivate ${selected.name}?`,
                        description: "It disappears from lists and running cards. Past incidents keep it.",
                        onConfirm: () => run(() => api(`/stations/${selected.id}`, { method: "PATCH", body: { isActive: false } }), "Station deactivated"),
                      })
                    }
                  >
                    Deactivate
                  </Button>
                </div>
              )}
            </div>

            <div className='flex items-center justify-between'>
              <h3 className='flex items-center gap-2 font-medium'>
                <Truck className='size-4' /> Trucks
              </h3>
              {editable && (
                <Button size='sm' variant='outline' onClick={() => openTruckForm(null)}>
                  <Plus /> Add truck
                </Button>
              )}
            </div>

            {selected.trucks.length === 0 ? (
              <Alert>
                <AlertDescription>No trucks. This station is skipped on running cards until a truck is added.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className='grid gap-2 md:hidden'>
                  {selected.trucks.map((t) => (
                    <div key={t.id} className='rounded-lg border p-3'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <div className='break-words font-condensed text-base font-semibold'>{t.callSign}</div>
                          <div className='text-xs text-muted-foreground'>
                            {[TRUCK_TYPES[t.type], OWNERSHIP[t.ownership], t.plateNumber, t.waterCapacityLiters != null && `${t.waterCapacityLiters} L`]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </div>
                        {editable && (
                          <div className='flex'>
                            <IconAction label='Edit' onClick={() => openTruckForm(t)}>
                              <Pencil />
                            </IconAction>
                            <IconAction label='Remove' destructive onClick={() => run(() => api(`/trucks/${t.id}`, { method: "DELETE" }), "Truck removed")}>
                              <Trash2 />
                            </IconAction>
                          </div>
                        )}
                      </div>
                      <div className='mt-2'>
                        {editable ? (
                          <SimpleSelect value={t.status} onChange={(s) => setStatus(t, s)} className='h-8 w-full' options={toOptions(TRUCK_STATUS)} />
                        ) : (
                          <TruckStatusBadge status={t.status} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='hidden overflow-x-auto md:block'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call sign</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Plate</TableHead>
                        <TableHead className='text-right'>Water (L)</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        {editable && <TableHead />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.trucks.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className='max-w-48 truncate font-condensed text-base font-semibold' title={t.callSign}>
                            {t.callSign}
                          </TableCell>
                          <TableCell>{TRUCK_TYPES[t.type]}</TableCell>
                          <TableCell>{t.plateNumber ?? "—"}</TableCell>
                          <TableCell className='text-right tabular-nums'>{t.waterCapacityLiters ?? "—"}</TableCell>
                          <TableCell>{OWNERSHIP[t.ownership]}</TableCell>
                          <TableCell>
                            {editable ? (
                              <SimpleSelect value={t.status} onChange={(s) => setStatus(t, s)} className='h-8 w-40' options={toOptions(TRUCK_STATUS)} />
                            ) : (
                              <TruckStatusBadge status={t.status} />
                            )}
                          </TableCell>
                          {editable && (
                            <TableCell className='text-right whitespace-nowrap'>
                              <IconAction label='Edit' onClick={() => openTruckForm(t)}>
                                <Pencil />
                              </IconAction>
                              <IconAction label='Remove' destructive onClick={() => run(() => api(`/trucks/${t.id}`, { method: "DELETE" }), "Truck removed")}>
                                <Trash2 />
                              </IconAction>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>
        ) : (
          <Card className='hidden min-h-64 items-center justify-center text-sm text-muted-foreground lg:flex'>Select a station to see its trucks.</Card>
        )}
      </div>

      <Dialog open={!!stationForm} onOpenChange={(o) => !o && setStationForm(null)}>
        <DialogContent className='max-h-[95svh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{stationForm?.id ? "Edit station" : `Add station to ${district?.name}`}</DialogTitle>
          </DialogHeader>
          {stationForm && (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='grid content-start gap-4'>
                {formError && (
                  <Alert variant='destructive'>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <Field label='Station name' error={stationErrors?.name}>
                  <Input value={stationForm.name} onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })} />
                </Field>
                <Field label='City' error={stationErrors?.cityId}>
                  <SimpleSelect
                    value={stationForm.cityId}
                    onChange={(cityId) => setStationForm({ ...stationForm, cityId })}
                    options={(stationForm.id ? district?.cities ?? [] : editableCities)
                      .filter((c) => canEditCity(user, c.id))
                      .map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Field>
                <Field label='Address' error={stationErrors?.address}>
                  <Input value={stationForm.address} onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })} />
                </Field>
                <Field label='Contact number' error={stationErrors?.contactNumber}>
                  <Input value={stationForm.contactNumber} onChange={(e) => setStationForm({ ...stationForm, contactNumber: e.target.value })} />
                </Field>
                <p className={`font-mono text-xs ${stationErrors?.lat ? "text-destructive" : "text-muted-foreground"}`}>
                  {stationForm.lat ? `${stationForm.lat.toFixed(6)}, ${stationForm.lng.toFixed(6)}` : "Click the map to place the station"}
                </p>
              </div>
              <div className='h-72 overflow-hidden rounded-lg border md:h-full md:min-h-80'>
                <MapComponent
                  kind='station'
                  position={stationForm.lat ? { lat: stationForm.lat, lng: stationForm.lng } : null}
                  onChange={(p) => setStationForm((f) => ({ ...f, lat: p.lat, lng: p.lng }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setStationForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveStation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!truckForm} onOpenChange={(o) => !o && setTruckForm(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{truckForm?.id ? "Edit truck" : "Add truck"}</DialogTitle>
          </DialogHeader>
          {truckForm && (
            <div className='grid gap-4'>
              {formError && (
                <Alert variant='destructive'>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <Field label='Call sign' error={truckErrors?.callSign}>
                <Input value={truckForm.callSign} onChange={(e) => setTruckForm({ ...truckForm, callSign: e.target.value })} />
              </Field>
              <div className='grid grid-cols-2 gap-4'>
                <Field label='Type' error={truckErrors?.type}>
                  <SimpleSelect value={truckForm.type} onChange={(type) => setTruckForm({ ...truckForm, type })} options={truckTypeOptions(truckForm.type)} />
                </Field>
                <Field label='Owner' error={truckErrors?.ownership}>
                  <SimpleSelect value={truckForm.ownership} onChange={(ownership) => setTruckForm({ ...truckForm, ownership })} options={toOptions(OWNERSHIP)} />
                </Field>
                <Field label='Plate number' error={truckErrors?.plateNumber}>
                  <Input value={truckForm.plateNumber} onChange={(e) => setTruckForm({ ...truckForm, plateNumber: e.target.value })} />
                </Field>
                <Field label='Water (liters)' error={truckErrors?.waterCapacityLiters}>
                  <Input
                    type='number'
                    min={0}
                    value={truckForm.waterCapacityLiters}
                    onChange={(e) => setTruckForm({ ...truckForm, waterCapacityLiters: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setTruckForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveTruck}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel='Deactivate'
        destructive
        onConfirm={() => confirm.onConfirm()}
      />
    </Page>
  );
}

export default StationsPage;
