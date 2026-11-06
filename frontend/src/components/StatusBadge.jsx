import { Badge } from "@/components/ui/badge";
import { TRUCK_STATUS } from "@/labels.js";

export function TruckStatusBadge({ status }) {
  const s = TRUCK_STATUS[status];
  return (
    <Badge variant='outline' className={s.className}>
      {s.label}
    </Badge>
  );
}
