import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import deploymentService from "@/service/deployment.service.js";
import useRefreshDeployment from "./useRefreshDeployment.js";

/** mutateAsync({ id, ...body }). Errors are shown in the form. */
const useEditDeployment = () => {
  const refresh = useRefreshDeployment();
  return useMutation({
    mutationFn: deploymentService.editDeployment,
    onSuccess: (d) => {
      toast.success("Deployment updated");
      return refresh(d.id);
    },
  });
};

export default useEditDeployment;
