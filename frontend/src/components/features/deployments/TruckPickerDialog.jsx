import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import useGetStations from "@/hooks/stations/useGetStations.js";
import useAssignTrucks from "@/hooks/deployments/useAssignTrucks.js";
import { TRUCK_TYPES } from "@/constants/truck.js";
import { districtName } from "@/utils/permissions.js";

/** Pick Available trucks from any district for a deployment; picks are kept while switching districts. */
function TruckPickerDialog({ deployment, open, onClose }) {
  const { data: districts = [] } = useGetDistricts();
  const [districtId, setDistrictId] = useState(1);
  const { data: stations = [], isPending } = useGetStations(districtId);
  const { mutateAsync: assignTrucks, isPending: saving } = useAssignTrucks();
  const [picked, setPicked] = useState(() => new Map()); // truckId -> callSign
  const [error, setError] = useState("");

  const withAvailable = stations.map((s) => ({ ...s, trucks: s.trucks.filter((t) => t.status === "AVAILABLE") })).filter((s) => s.trucks.length > 0);
  const toggle = (t) =>
    setPicked((p) => {
      const next = new Map(p);
      if (next.has(t.id)) next.delete(t.id);
      else next.set(t.id, t.callSign);
      return next;
    });
  const close = () => {
    setPicked(new Map());
    setError("");
    onClose();
  };
  const save = async () => {
    setError("");
    try {
      await assignTrucks({ id: deployment.id, truckIds: [...picked.keys()] });
      close();
    } catch (e) {
      setError(e.message); // e.g. a truck was dispatched meanwhile: nothing was assigned
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && close()}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Add trucks to {deployment.name}</DialogTitle>
          <DialogDescription>Only Available trucks are listed. Deployed trucks leave the running card until released.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <SimpleSelect
          value={districtId}
          onChange={setDistrictId}
          aria-label='Fire district'
          options={districts.map((d) => ({ value: d.id, label: districtName(d) }))}
        />
        {isPending ? (
          <ListSkeleton rows={4} />
        ) : withAvailable.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>No available trucks in this district.</p>
        ) : (
          <ul className='grid max-h-[50svh] gap-3 overflow-auto'>
            {withAvailable.map((s) => (
              <li key={s.id} className='rounded-lg border p-3'>
                <div className='text-sm font-medium'>{s.name}</div>
                <div className='mb-2 text-xs text-muted-foreground'>{s.city?.name ?? "No city set"}</div>
                <div className='grid gap-1.5'>
                  {s.trucks.map((t) => (
                    <label key={t.id} className='flex cursor-pointer items-center gap-2 text-sm'>
                      <input type='checkbox' className='size-4 accent-primary' checked={picked.has(t.id)} onChange={() => toggle(t)} />
                      <span className='font-condensed text-base font-semibold'>{t.callSign}</span>
                      <span className='text-xs text-muted-foreground'>{TRUCK_TYPES[t.type]}</span>
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {picked.size > 0 && <p className='text-sm'>Selected: {[...picked.values()].join(", ")}</p>}
        <DialogFooter>
          <Button variant='outline' onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || picked.size === 0}>
            {saving && <LoaderCircle className='animate-spin' />} Deploy {picked.size || ""} truck{picked.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TruckPickerDialog;
