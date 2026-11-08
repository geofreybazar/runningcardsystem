import { useQuery } from "@tanstack/react-query";
import deploymentService from "@/service/deployment.service.js";

const useGetDeployments = (status) => useQuery({ queryKey: ["deployments", status], queryFn: () => deploymentService.getDeployments(status) });

export default useGetDeployments;
