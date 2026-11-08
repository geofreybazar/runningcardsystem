import { useQuery } from "@tanstack/react-query";
import deploymentService from "@/service/deployment.service.js";

// Live notifications invalidate ["deployment", id], so trucks assigned or released elsewhere show at once.
const useGetDeployment = (id) => useQuery({ queryKey: ["deployment", id], queryFn: () => deploymentService.getDeployment(id) });

export default useGetDeployment;
