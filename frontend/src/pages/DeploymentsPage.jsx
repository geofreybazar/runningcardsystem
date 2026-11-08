import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Page from "@/components/common/Page.jsx";
import ListSkeleton from "@/components/common/ListSkeleton.jsx";
import DeploymentCard from "@/components/features/deployments/list/DeploymentCard.jsx";
import DeploymentsTable from "@/components/features/deployments/list/DeploymentsTable.jsx";
import DeploymentFormDialog from "@/components/features/deployments/DeploymentFormDialog.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetDeployments from "@/hooks/deployments/useGetDeployments.js";
import { canManageDeployments } from "@/utils/permissions.js";
import { deploymentToForm } from "@/utils/deploymentForm.js";

function DeploymentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("ACTIVE");
  const [form, setForm] = useState(null);
  const { data: deployments, isPending } = useGetDeployments(status);
  const canManage = canManageDeployments(user);

  const open = (d) => navigate(`/deployments/${d.id}`);
  const placeholder = isPending ? (
    <ListSkeleton className='p-3' />
  ) : (
    deployments?.length === 0 && <p className='py-10 text-center text-sm text-muted-foreground'>No {status === "ACTIVE" ? "active" : "ended"} deployments.</p>
  );

  return (
    <Page
      title='Special Deployments'
      description='Trucks sent to planned events such as ASEAN or SONA. While deployed they are left off every running card.'
      actions={
        <>
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              <TabsTrigger value='ACTIVE'>Active</TabsTrigger>
              <TabsTrigger value='ENDED'>Ended</TabsTrigger>
            </TabsList>
          </Tabs>
          {canManage && (
            <Button onClick={() => setForm(deploymentToForm(null))}>
              <Plus /> New deployment
            </Button>
          )}
        </>
      }
    >
      {/* Phones: tappable cards. Wider screens: a table. */}
      <div className='grid gap-2 md:hidden'>
        {placeholder}
        {deployments?.map((d) => (
          <DeploymentCard key={d.id} deployment={d} onOpen={() => open(d)} />
        ))}
      </div>
      <Card className='hidden py-0 md:block'>{placeholder || <DeploymentsTable deployments={deployments} onOpen={open} />}</Card>

      <DeploymentFormDialog initial={form} onClose={() => setForm(null)} onSaved={open} />
    </Page>
  );
}

export default DeploymentsPage;
