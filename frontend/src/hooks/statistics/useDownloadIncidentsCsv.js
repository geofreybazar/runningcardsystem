import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import statisticsService from "@/service/statistics.service.js";

/** mutate(query): downloads the incidents CSV for the current filters. */
const useDownloadIncidentsCsv = () => useMutation({ mutationFn: statisticsService.downloadIncidentsCsv, onError: (e) => toast.error(e.message) });

export default useDownloadIncidentsCsv;
