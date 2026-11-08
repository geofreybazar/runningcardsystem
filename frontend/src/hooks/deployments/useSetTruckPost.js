import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import deploymentService from "@/service/deployment.service.js";
import useRefreshDeployment from "./useRefreshDeployment.js";

/** mutateAsync({ id, truckId, postLabel, lat, lng }). Errors are shown in the post dialog. */
const useSetTruckPost = () => {
  const refresh = useRefreshDeployment();
  return useMutation({
    mutationFn: deploymentService.setTruckPost,
    onSuccess: (_, { id, postLabel }) => {
      toast.success(`Post set: ${postLabel}`);
      return refresh(id);
    },
  });
};

export default useSetTruckPost;
