import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import deploymentService from "@/service/deployment.service.js";

/** mutate({ id, name }); name is only for the toast. Its trucks still there are released by the server. */
const useDeleteDeployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deploymentService.deleteDeployment(id),
    onSuccess: (_, { id, name }) => {
      toast.success(`${name} deleted`);
      queryClient.removeQueries({ queryKey: ["deployment", id] });
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (e) => toast.error(e.message),
  });
};

export default useDeleteDeployment;
