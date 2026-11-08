import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import stationService from "@/service/station.service.js";
import { TRUCK_STATUS } from "@/constants/truck.js";

/** mutate({ truck, status }) */
const useChangeTruckStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ truck, status }) => stationService.changeTruckStatus({ id: truck.id, status }),
    onSuccess: (_, { truck, status }) => {
      toast.success(`${truck.callSign}: ${TRUCK_STATUS[status].label}`);
      return queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useChangeTruckStatus;
