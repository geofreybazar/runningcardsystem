import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

function BarangayCombobox({ id, barangays, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant='outline' role='combobox' aria-expanded={open} disabled={disabled} className='w-full justify-between bg-card font-normal'>
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value?.name ?? "Barangay"}</span>
          <ChevronsUpDown className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) min-w-56 p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search barangay…' />
          <CommandList>
            <CommandEmpty>No barangay found.</CommandEmpty>
            {barangays.map((b) => (
              <CommandItem
                key={b.id}
                value={b.name}
                onSelect={() => {
                  setOpen(false);
                  onChange(b);
                }}
              >
                {b.name}
                <Check className={cn("ml-auto", value?.id === b.id ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default BarangayCombobox;
