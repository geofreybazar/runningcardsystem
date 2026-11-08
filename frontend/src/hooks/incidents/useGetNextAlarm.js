import { useQuery } from "@tanstack/react-query";
import incidentService from "@/service/incident.service.js";

/** The next alarm's card, for this city's dispatchers only (`enabled`). */
const useGetNextAlarm = (id, enabled) =>
  useQuery({
    queryKey: ["incident", id, "next-alarm"],
    queryFn: () => incidentService.getNextAlarm(id),
    enabled,
    staleTime: 0, // built from live truck status
  });

export default useGetNextAlarm;
