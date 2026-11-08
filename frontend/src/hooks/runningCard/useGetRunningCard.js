import { keepPreviousData, useQuery } from "@tanstack/react-query";
import runningCardService from "@/service/runningCard.service.js";

/** The card for a pinned location (null: none yet). Always refetched: it comes from live truck status. */
const useGetRunningCard = (location) =>
  useQuery({
    queryKey: ["running-card", location?.lat, location?.lng],
    queryFn: () => runningCardService.getRunningCard(location),
    enabled: !!location,
    staleTime: 0,
    placeholderData: keepPreviousData, // the last card stays (dimmed) while a new location loads
  });

export default useGetRunningCard;
