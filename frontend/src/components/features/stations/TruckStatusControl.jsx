import { Link } from "react-router-dom";
import SimpleSelect from "@/components/common/SimpleSelect.jsx";
import TruckStatusBadge from "@/components/common/TruckStatusBadge.jsx";
import useChangeTruckStatus from "@/hooks/stations/useChangeTruckStatus.js";
import { EDITABLE_TRUCK_STATUS, toOptions } from "@/constants/truck.js";

/**
 * A truck's status: a menu for station editors, a badge for everyone else.
 * A deployed truck is the deployment's until Regional Operations releases it, so it shows where it went instead.
 */
function TruckStatusControl({ truck, editable, className }) {
  const { mutate: changeStatus } = useChangeTruckStatus();
  const deployment = truck.deploymentUnits?.[0]?.deployment;

  if (truck.status === "DEPLOYED") {
    return (
      <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <TruckStatusBadge status='DEPLOYED' />
        {deployment && (
          <Link to={`/deployments/${deployment.id}`} className='text-xs font-medium text-primary hover:underline'>
            {deployment.name}
          </Link>
        )}
      </span>
    );
  }
  if (!editable) return <TruckStatusBadge status={truck.status} />;
  return (
    <SimpleSelect
      value={truck.status}
      onChange={(status) => changeStatus({ truck, status })}
      className={className}
      options={toOptions(EDITABLE_TRUCK_STATUS)}
    />
  );
}

export default TruckStatusControl;
