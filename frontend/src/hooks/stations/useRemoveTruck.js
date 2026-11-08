import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import stationService from "@/service/station.service.js";

/** mutate(id) */
const useRemoveTruck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationService.removeTruck,
    onSuccess: () => {
      toast.success("Truck removed");
      return queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useRemoveTruck;
