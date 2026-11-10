import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import { districtName } from "@/utils/permissions.js";
import { presetRange } from "@/utils/stats.js";
import { PRESETS } from "@/constants/statistics.js";

/** One filter row above everything: preset ranges, dates, district/city, and the CSV download. */
function Filters({ from, to, districtId, cityId, districts, onChange, onDownload, downloading }) {
  const set = onChange;
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.value);
    return r.from === from && r.to === to;
  })?.value;
  const district = districts.find((d) => String(d.id) === districtId);

  return (
    <div className='sticky top-12 z-20 -mx-3 flex flex-wrap items-end gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur md:-mx-5 md:px-5'>
      <Tabs value={activePreset ?? ""} onValueChange={(p) => set(presetRange(p))}>
        <TabsList>
          {PRESETS.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <label className='grid gap-1 text-xs text-muted-foreground'>
        From
        <Input type='date' className='h-9 w-40 bg-card' value={from} max={to} onChange={(e) => e.target.value && set({ from: e.target.value })} />
      </label>
      <label className='grid gap-1 text-xs text-muted-foreground'>
        To
        <Input type='date' className='h-9 w-40 bg-card' value={to} min={from} onChange={(e) => e.target.value && set({ to: e.target.value })} />
      </label>
      <SimpleSelect
        className='h-9 w-56 bg-card'
        aria-label='District'
        value={districtId}
        onChange={(v) => set({ districtId: v === "all" ? "" : String(v), cityId: "" })}
        options={[{ value: "all", label: "All districts" }, ...districts.map((d) => ({ value: String(d.id), label: districtName(d) }))]}
        placeholder='All districts'
      />
      {district && district.cities.length > 1 && (
        <SimpleSelect
          className='h-9 w-44 bg-card'
          aria-label='City'
          value={cityId}
          onChange={(v) => set({ cityId: v === "all" ? "" : String(v) })}
          options={[{ value: "all", label: "All cities" }, ...district.cities.map((c) => ({ value: String(c.id), label: c.name }))]}
          placeholder='All cities'
        />
      )}
      <Button variant='outline' className='h-9 sm:ml-auto' onClick={onDownload} disabled={downloading}>
        {downloading ? <LoaderCircle className='animate-spin' /> : <Download />} Download CSV
      </Button>
    </div>
  );
}

export default Filters;
