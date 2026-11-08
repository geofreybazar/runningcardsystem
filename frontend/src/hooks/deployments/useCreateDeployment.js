import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import deploymentService from "@/service/deployment.service.js";
import useRefreshDeployment from "./useRefreshDeployment.js";

/** mutateAsync(body) → the new deployment. Errors are shown in the form. */
const useCreateDeployment = () => {
  const refresh = useRefreshDeployment();
  return useMutation({
    mutationFn: deploymentService.createDeployment,
    onSuccess: (d) => {
      toast.success(`${d.name} created`);
      return refresh();
    },
  });
};

export default useCreateDeployment;
