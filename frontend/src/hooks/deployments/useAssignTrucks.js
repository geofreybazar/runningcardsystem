import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import deploymentService from "@/service/deployment.service.js";
import useRefreshDeployment from "./useRefreshDeployment.js";

/** mutateAsync({ id, truckIds }). All or nothing: one truck no longer available fails the step (shown in the picker). */
const useAssignTrucks = () => {
  const refresh = useRefreshDeployment();
  return useMutation({
    mutationFn: deploymentService.assignTrucks,
    onSuccess: (_, { id, truckIds }) => {
      toast.success(`${truckIds.length} truck${truckIds.length > 1 ? "s" : ""} deployed`);
      return refresh(id);
    },
  });
};

export default useAssignTrucks;
