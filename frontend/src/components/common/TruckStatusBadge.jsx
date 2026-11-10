import StatusBadge from "@/components/common/StatusBadge.jsx";
import { TRUCK_STATUS } from "@/constants/truck.js";

function TruckStatusBadge({ status, className }) {
  const s = TRUCK_STATUS[status];
  return (
    <StatusBadge tone={s.tone} className={className}>
      {s.label}
    </StatusBadge>
  );
}

export default TruckStatusBadge;
