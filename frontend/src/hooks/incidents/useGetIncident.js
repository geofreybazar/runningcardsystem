import { useQuery } from "@tanstack/react-query";
import incidentService from "@/service/incident.service.js";

// Live notifications invalidate ["incident", id], so a raise or close by another office shows at once.
const useGetIncident = (id) => useQuery({ queryKey: ["incident", id], queryFn: () => incidentService.getIncident(id) });

export default useGetIncident;
