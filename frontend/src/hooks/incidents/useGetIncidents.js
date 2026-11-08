import { useQuery } from "@tanstack/react-query";
import incidentService from "@/service/incident.service.js";

// Live notifications invalidate ["incidents"], so any dispatch, raise or close in my area reloads the list.
const useGetIncidents = (status) => useQuery({ queryKey: ["incidents", status], queryFn: () => incidentService.getIncidents(status) });

export default useGetIncidents;
