import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import incidentService from "@/service/incident.service.js";

/** Dispatch: saves the incident and sends the card's first alarm. */
const useCreateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incidentService.createIncident,
    onSuccess: (incident) => {
      toast.success(`${incident.alarmLevel} dispatched`);
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useCreateIncident;
