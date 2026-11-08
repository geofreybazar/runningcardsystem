import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import incidentService from "@/service/incident.service.js";
import useRefreshIncident from "./useRefreshIncident.js";

/** mutate({ id, truckPicks, alarmLevel }); alarmLevel is only for the toast. */
const useRaiseAlarm = () => {
  const refresh = useRefreshIncident();
  return useMutation({
    mutationFn: ({ id, truckPicks }) => incidentService.raiseAlarm({ id, truckPicks }),
    onSuccess: (_, { alarmLevel }) => toast.success(`Raised to ${alarmLevel}`),
    onError: (e) => toast.error(e.message),
    // Reload even after an error: someone else may have raised or closed it first.
    onSettled: (_, __, { id }) => refresh(id),
  });
};

export default useRaiseAlarm;
