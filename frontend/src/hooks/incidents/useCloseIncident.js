import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import incidentService from "@/service/incident.service.js";
import useRefreshIncident from "./useRefreshIncident.js";

/** mutate(id) */
const useCloseIncident = () => {
  const refresh = useRefreshIncident();
  return useMutation({
    mutationFn: incidentService.closeIncident,
    onSuccess: () => toast.success("Incident closed"),
    onError: (e) => toast.error(e.message),
    onSettled: (_, __, id) => refresh(id),
  });
};

export default useCloseIncident;
