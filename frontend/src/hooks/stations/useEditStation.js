import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import stationService from "@/service/station.service.js";

/** mutateAsync({ id, ...body }) → the station. Errors are shown in the form. */
const useEditStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationService.editStation,
    onSuccess: () => {
      toast.success("Station updated");
      return queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
};

export default useEditStation;
