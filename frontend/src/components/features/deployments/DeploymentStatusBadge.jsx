import StatusBadge from "@/components/common/StatusBadge.jsx";
import { DEPLOYMENT_STATUS } from "@/constants/status.js";

/** Active deployments share the info tone with their trucks' "Deployed" badge; ended ones are muted. */
function DeploymentStatusBadge({ status }) {
  const s = DEPLOYMENT_STATUS[status];
  return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
}

export default DeploymentStatusBadge;
