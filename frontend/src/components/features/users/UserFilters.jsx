import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import useGetDistricts from "@/hooks/districts/useGetDistricts.js";
import { districtName } from "@/utils/permissions.js";

/** Search by name or account number; narrow to the Regional office, a fire district, or one city's office. */
function UserFilters({ filters, onChange, shown, total }) {
  const { data: districts = [] } = useGetDistricts();
  const district = districts.find((d) => d.id === filters.office);

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative w-full sm:w-72'>
        <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          className='bg-card pl-8'
          placeholder='Search name or account number'
          aria-label='Search users'
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <SimpleSelect
        className='w-full bg-card sm:w-64'
        aria-label='Office'
        value={filters.office}
        onChange={(office) => onChange({ ...filters, office, cityId: "ALL" })}
        options={[
          { value: "ALL", label: "All offices" },
          { value: "REGIONAL", label: "Regional Headquarters" },
          ...districts.map((d) => ({ value: d.id, label: districtName(d) })),
        ]}
      />
      {/* Manila and Quezon City are their own districts, so only multi-city districts get a city filter. */}
      {district && district.cities.length > 1 && (
        <SimpleSelect
          className='w-full bg-card sm:w-48'
          aria-label='City'
          value={filters.cityId}
          onChange={(cityId) => onChange({ ...filters, cityId })}
          options={[{ value: "ALL", label: "All cities" }, ...district.cities.map((c) => ({ value: c.id, label: c.name }))]}
        />
      )}
      <span className='text-sm text-muted-foreground sm:ml-auto'>{shown === total ? `${total} users` : `${shown} of ${total} users`}</span>
    </div>
  );
}

export default UserFilters;
