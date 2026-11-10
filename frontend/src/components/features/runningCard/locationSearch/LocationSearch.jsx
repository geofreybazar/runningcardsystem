import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PlaceSearch from "./PlaceSearch.jsx";
import DistrictPicker from "./DistrictPicker.jsx";

/** The fire location: address / landmark / coordinates search, or District → City → Barangay from the side button. */
function LocationSearch({ onSelect }) {
  const [error, setError] = useState("");
  const [byDistrict, setByDistrict] = useState(false);
  return (
    <div className='grid gap-1.5'>
      <div className='flex gap-2'>
        <div className='min-w-0 flex-1 shadow-md'>
          <PlaceSearch onSelect={onSelect} onError={setError} />
        </div>
        <Popover open={byDistrict} onOpenChange={setByDistrict}>
          <PopoverTrigger asChild>
            <Button variant='outline' className='h-11 shrink-0 bg-card shadow-md' aria-label='Pick by BFP district, city and barangay'>
              <Building2 /> <span className='hidden sm:inline'>By district</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align='end' className='w-80'>
            <p className='mb-3 text-label text-muted-foreground'>Pick by BFP district</p>
            <DistrictPicker
              onError={setError}
              onSelect={(...args) => {
                setByDistrict(false);
                onSelect(...args);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <p role='alert' className='w-fit max-w-full rounded-sm bg-card px-2 py-1 text-sm text-danger-foreground shadow-md'>
          {error}
        </p>
      )}
    </div>
  );
}

export default LocationSearch;
