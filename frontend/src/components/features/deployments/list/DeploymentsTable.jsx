import DataTable from "@/components/common/DataTable.jsx";
import DeploymentStatusBadge from "@/components/features/deployments/DeploymentStatusBadge.jsx";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";

/** Wider screens: the deployment schedule. "Trucks" counts the ones still there. */
function DeploymentsTable({ deployments, onOpen }) {
  const columns = [
    { key: "status", header: "Status", cell: (d) => <DeploymentStatusBadge status={d.status} /> },
    { key: "event", header: "Event", className: "font-medium", cell: (d) => d.name },
    { key: "venue", header: "Venue", className: "max-w-72 truncate", cell: (d) => d.locationLabel },
    { key: "starts", header: "Starts", className: "whitespace-nowrap", cell: (d) => formatDateTime(d.startsAt) },
    { key: "ends", header: "Planned end", className: "whitespace-nowrap text-muted-foreground", cell: (d) => (d.endsAt ? formatDateTime(d.endsAt) : "—") },
    { key: "trucks", header: "Trucks", headClassName: "text-right", className: "text-right font-data text-base", cell: (d) => d._count.units },
    { key: "by", header: "Created by", className: "whitespace-nowrap", cell: (d) => displayName(d.createdBy) },
  ];
  return <DataTable caption='Special deployments' columns={columns} rows={deployments} onRowClick={onOpen} />;
}

export default DeploymentsTable;
