import { STATUS_TONES } from "@/constants/status.js";
import { TRUCK_STATUS } from "@/constants/truck.js";

const ORDER = ["AVAILABLE", "RESPONDING", "DEPLOYED", "OUT_OF_SERVICE"];

/** A station's trucks as one segmented bar, one segment per truck in its status colour, with the count available. */
function AvailabilityMeter({ trucks }) {
  const available = trucks.filter((t) => t.status === "AVAILABLE").length;
  const sorted = [...trucks].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const summary = ORDER.map((s) => [s, trucks.filter((t) => t.status === s).length])
    .filter(([, n]) => n)
    .map(([s, n]) => `${n} ${TRUCK_STATUS[s].label.toLowerCase()}`)
    .join(", ");
  return (
    <div className='flex items-center gap-2' title={summary || "No trucks"}>
      <div className='flex h-1.5 w-20 gap-px overflow-hidden rounded-[1px] bg-muted' aria-hidden='true'>
        {sorted.map((t) => (
          <span key={t.id} className={`flex-1 ${STATUS_TONES[TRUCK_STATUS[t.status].tone].dot}`} />
        ))}
      </div>
      <span className={`font-data text-sm ${trucks.length && !available ? "text-danger-foreground" : "text-muted-foreground"}`}>
        {available}/{trucks.length} available
      </span>
      <span className='sr-only'>{summary}</span>
    </div>
  );
}

export default AvailabilityMeter;
