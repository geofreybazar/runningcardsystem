import { useQueryClient } from "@tanstack/react-query";

/** After a change: the deployment, the lists, and truck statuses on the Stations page. Resolves when the deployment is back. */
const useRefreshDeployment = () => {
  const queryClient = useQueryClient();
  return async (id) => {
    queryClient.invalidateQueries({ queryKey: ["deployments"] });
    queryClient.invalidateQueries({ queryKey: ["stations"] });
    if (id) await queryClient.invalidateQueries({ queryKey: ["deployment", id] });
  };
};

export default useRefreshDeployment;
