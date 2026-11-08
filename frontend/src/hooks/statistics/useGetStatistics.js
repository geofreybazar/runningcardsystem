import { keepPreviousData, useQuery } from "@tanstack/react-query";
import statisticsService from "@/service/statistics.service.js";

/** The previous filter's charts stay (isPlaceholderData) while the new ones load. */
const useGetStatistics = (query) =>
  useQuery({ queryKey: ["statistics", query], queryFn: () => statisticsService.getStatistics(query), placeholderData: keepPreviousData });

export default useGetStatistics;
