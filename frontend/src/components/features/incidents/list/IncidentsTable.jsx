import DataTable from "@/components/common/DataTable.jsx";
import StatusBadge from "@/components/common/StatusBadge.jsx";
import Elapsed from "@/components/common/Elapsed.jsx";
import IncidentAlarmBadge from "@/components/features/incidents/IncidentAlarmBadge.jsx";
import { INCIDENT_STATUS } from "@/constants/status.js";
import { formatDateTime } from "@/utils/dateTime.js";
import { displayName } from "@/utils/person.js";

/** Wider screens: one dense row per incident, newest first; open ones run a live timer, closed ones show the total. */
function IncidentsTable({ incidents, onOpen }) {
  const columns = [
    {
      key: "status",
      header: "Status",
      cell: (i) => (
        <StatusBadge tone={INCIDENT_STATUS[i.status].tone} pulse={i.status === "OPEN"}>
          {INCIDENT_STATUS[i.status].label}
        </StatusBadge>
      ),
    },
    {
      key: "incident",
      header: "Incident",
      className: "max-w-96",
      cell: (i) => (
        <div className='min-w-0'>
          <div className='truncate font-medium'>{i.locationLabel}</div>
          <div className='font-data text-xs text-muted-foreground'>
            {i.lat.toFixed(5)}, {i.lng.toFixed(5)}
          </div>
        </div>
      ),
    },
    { key: "city", header: "City", cell: (i) => i.city?.name ?? "—" },
    { key: "alarm", header: "Alarm", cell: (i) => <IncidentAlarmBadge incident={i} /> },
    { key: "units", header: "Units", headClassName: "text-right", className: "text-right font-data text-base", cell: (i) => i._count.units },
    { key: "dispatched", header: "Dispatched", className: "whitespace-nowrap text-muted-foreground", cell: (i) => formatDateTime(i.createdAt) },
    {
      key: "elapsed",
      header: "Duration",
      className: "whitespace-nowrap",
      cell: (i) => <Elapsed from={i.createdAt} to={i.closedAt} />,
    },
    { key: "by", header: "Dispatcher", className: "whitespace-nowrap", cell: (i) => displayName(i.createdBy) },
  ];
  return <DataTable caption='Incidents' columns={columns} rows={incidents} onRowClick={onOpen} />;
}

export default IncidentsTable;
