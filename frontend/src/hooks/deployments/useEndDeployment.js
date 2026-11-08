import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import deploymentService from "@/service/deployment.service.js";
import useRefreshDeployment from "./useRefreshDeployment.js";

/** mutate(id): releases every truck still there and closes the deployment. */
const useEndDeployment = () => {
  const refresh = useRefreshDeployment();
  return useMutation({
    mutationFn: deploymentService.endDeployment,
    onSuccess: (d) => {
      toast.success(`${d.name} ended; its trucks are available again`);
      return refresh(d.id);
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useEndDeployment;
