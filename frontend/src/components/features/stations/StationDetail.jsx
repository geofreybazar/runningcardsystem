import { ChevronLeft, MapPin, Pencil, Phone, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TruckList from "./TruckList.jsx";

/** The selected station: address, contact, actions for editors, and its trucks. */
function StationDetail({ station, editable, onBack, onEdit, onDeactivate, onAddTruck, onEditTruck }) {
  return (
    <Card className='min-w-0 gap-4 px-4 py-4 md:px-6'>
      <button onClick={onBack} className='flex w-fit items-center gap-1 text-sm text-muted-foreground lg:hidden'>
        <ChevronLeft className='size-4' /> Stations
      </button>
      <div className='flex flex-wrap items-start gap-3'>
        <div className='min-w-0 flex-1'>
          <h2 className='text-lg font-semibold'>{station.name}</h2>
          <div className='mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <MapPin className='size-3.5' />
              {[station.city?.name, station.address].filter(Boolean).join(", ") || "No address"}
            </span>
            {station.contactNumber && (
              <span className='flex items-center gap-1'>
                <Phone className='size-3.5' />
                {station.contactNumber}
              </span>
            )}
          </div>
        </div>
        {editable && (
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={onEdit}>
              <Pencil /> Edit
            </Button>
            <Button variant='outline' size='sm' className='text-destructive' onClick={onDeactivate}>
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
          <Button size='sm' variant='outline' onClick={onAddTruck}>
            <Plus /> Add truck
          </Button>
        )}
      </div>

      <TruckList trucks={station.trucks} editable={editable} onEditTruck={onEditTruck} />
    </Card>
  );
}

export default StationDetail;
