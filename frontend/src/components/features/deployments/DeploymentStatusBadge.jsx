import { Badge } from "@/components/ui/badge";

/** Active deployments use the gold accent, like their trucks' "Deployed" badge; ended ones are muted. */
const DeploymentStatusBadge = ({ status }) =>
  status === "ACTIVE" ? (
    <Badge variant='outline' className='border-gold/50 bg-gold/20 text-foreground'>
      Active
    </Badge>
  ) : (
    <Badge variant='outline' className='bg-muted text-muted-foreground'>
      Ended
    </Badge>
  );

export default DeploymentStatusBadge;
