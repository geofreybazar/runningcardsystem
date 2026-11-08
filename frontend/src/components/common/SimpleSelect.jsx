import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** shadcn Select over plain { value, label } options; keeps the caller's value type (number or string). */
function SimpleSelect({ value, onChange, options, placeholder = "Select…", disabled, className, id, ...aria }) {
  return (
    <Select
      value={value === "" || value == null ? "" : String(value)}
      onValueChange={(v) => onChange(options.find((o) => String(o.value) === v)?.value)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className ?? "w-full"} {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SimpleSelect;
