import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import stationService from "@/service/station.service.js";

/** mutateAsync({ id, ...body }). Errors are shown in the form. */
const useEditTruck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationService.editTruck,
    onSuccess: () => {
      toast.success("Truck updated");
      return queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
};

export default useEditTruck;
