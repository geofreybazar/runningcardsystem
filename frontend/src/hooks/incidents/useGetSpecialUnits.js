import { useQuery } from "@tanstack/react-query";
import incidentService from "@/service/incident.service.js";

/** Nearest stations with an available special unit of `type`; idle until a type is chosen. */
const useGetSpecialUnits = (id, type) =>
  useQuery({
    // Under ["incident", id] so refreshing the incident reloads it too.
    queryKey: ["incident", id, "special-units", type],
    queryFn: () => incidentService.getSpecialUnits(id, type),
    enabled: Boolean(type),
    staleTime: 0, // built from live truck status
  });

export default useGetSpecialUnits;
