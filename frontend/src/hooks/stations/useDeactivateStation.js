import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import stationService from "@/service/station.service.js";

/** mutate(id) */
const useDeactivateStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationService.deactivateStation,
    onSuccess: () => {
      toast.success("Station deactivated");
      return queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useDeactivateStation;
