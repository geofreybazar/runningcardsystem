import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import stationService from "@/service/station.service.js";

/** mutateAsync(body) → the new station. Errors are shown in the form. */
const useAddStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stationService.addStation,
    onSuccess: () => {
      toast.success("Station added");
      return queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
};

export default useAddStation;
