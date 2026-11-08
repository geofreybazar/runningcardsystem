import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import stationService from "@/service/station.service.js";

/** mutateAsync({ stationId, ...body }). Errors are shown in the form. */
const useAddTruck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationService.addTruck,
    onSuccess: () => {
      toast.success("Truck added");
      return queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
};

export default useAddTruck;
