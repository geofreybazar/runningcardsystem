import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import deploymentService from "@/service/deployment.service.js";
import useRefreshDeployment from "./useRefreshDeployment.js";

/** mutate({ id, truckId, callSign }); callSign is only for the toast. */
const useReleaseTruck = () => {
  const refresh = useRefreshDeployment();
  return useMutation({
    mutationFn: ({ id, truckId }) => deploymentService.releaseTruck({ id, truckId }),
    onSuccess: (_, { id, callSign }) => {
      toast.success(`${callSign} released`);
      return refresh(id);
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useReleaseTruck;
