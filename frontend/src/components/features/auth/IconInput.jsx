import { Input } from "@/components/ui/input";

/** Pill input with a leading icon and an optional trailing control; Field passes the id through to the input. */
function IconInput({ icon: Icon, end, className, ...props }) {
  return (
    <div className='relative'>
      <Icon className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground' aria-hidden='true' />
      <Input className={`h-11 rounded-full pl-11 ${end ? "pr-11" : ""} ${className ?? ""}`} {...props} />
      {end}
    </div>
  );
}

export default IconInput;
