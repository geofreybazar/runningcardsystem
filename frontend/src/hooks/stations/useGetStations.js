import { useQuery } from "@tanstack/react-query";
import stationService from "@/service/station.service.js";

// Live notifications invalidate ["stations"]: dispatches change truck status.
const useGetStations = (districtId) => useQuery({ queryKey: ["stations", districtId], queryFn: () => stationService.getStations(districtId) });

export default useGetStations;
