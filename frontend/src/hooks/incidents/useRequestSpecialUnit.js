import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import incidentService from "@/service/incident.service.js";
import useRefreshIncident from "./useRefreshIncident.js";

/** mutate({ id, truckId, label }); label (e.g. "Ambulance A-1") is only for the toast. */
const useRequestSpecialUnit = () => {
  const refresh = useRefreshIncident();
  return useMutation({
    mutationFn: ({ id, truckId }) => incidentService.requestSpecialUnit({ id, truckId }),
    onSuccess: (_, { label }) => toast.success(`${label} sent`),
    onError: (e) => toast.error(e.message),
    // Reload even after an error: the unit may have been taken meanwhile.
    onSettled: (_, __, { id }) => refresh(id),
  });
};

export default useRequestSpecialUnit;
