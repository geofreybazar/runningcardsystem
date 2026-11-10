import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Page from "@/components/common/Page.jsx";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import MapComponent from "@/components/common/MapComponent.jsx";
import DeploymentHeader from "@/components/features/deployments/detail/DeploymentHeader.jsx";
import DeploymentTrucks from "@/components/features/deployments/detail/DeploymentTrucks.jsx";
import DeploymentFormDialog from "@/components/features/deployments/DeploymentFormDialog.jsx";
import TruckPickerDialog from "@/components/features/deployments/TruckPickerDialog.jsx";
import TruckPostDialog from "@/components/features/deployments/TruckPostDialog.jsx";
import useAuth from "@/hooks/auth/useAuth.js";
import useGetDeployment from "@/hooks/deployments/useGetDeployment.js";
import useReleaseTruck from "@/hooks/deployments/useReleaseTruck.js";
import useEndDeployment from "@/hooks/deployments/useEndDeployment.js";
import useDeleteDeployment from "@/hooks/deployments/useDeleteDeployment.js";
import { canManageDeployments } from "@/utils/permissions.js";
import { deploymentToForm } from "@/utils/deploymentForm.js";
import { deployedTruckMarkers } from "@/utils/deploymentMap.js";
import usePageTitle from "@/hooks/layout/usePageTitle.js";

function DeploymentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: deployment, isError } = useGetDeployment(id);
  usePageTitle(deployment?.name ?? "Special deployment", { to: "/deployments", label: "Special Deployments", aria: "All deployments" });
  const remove = useDeleteDeployment();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const release = useReleaseTruck();
  const end = useEndDeployment();
  const [form, setForm] = useState(null);
  const [picking, setPicking] = useState(false);
  const [posting, setPosting] = useState(null); // the unit whose post is being set
  const [confirmEnd, setConfirmEnd] = useState(false);
  const position = useMemo(() => deployment && { lat: deployment.lat, lng: deployment.lng }, [deployment?.lat, deployment?.lng]); // eslint-disable-line react-hooks/exhaustive-deps -- refit only when the pin moves

  // Deleted (e.g. opened from an older notification) or never existed.
  if (isError) {
    return (
      <Page>
        <Link to='/deployments' className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
          <ChevronLeft className='size-4' /> All deployments
        </Link>
        <p className='py-10 text-center text-sm text-muted-foreground'>This deployment was deleted or does not exist.</p>
      </Page>
    );
  }

  if (!deployment) {
    return (
      <Page>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-72 w-full' />
      </Page>
    );
  }

  const canManage = canManageDeployments(user);
  const active = deployment.status === "ACTIVE";
  const busy = release.isPending || end.isPending || remove.isPending;
  const stillThere = deployment.units.filter((u) => !u.releasedAt).length;

  return (
    <Page>
      <DeploymentHeader
        deployment={deployment}
        canManage={canManage}
        busy={busy}
        onEdit={() => setForm(deploymentToForm(deployment))}
        onAddTrucks={() => setPicking(true)}
        onEnd={() => setConfirmEnd(true)}
        onDelete={() => setConfirmDelete(true)}
      />

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]'>
        <div className='h-72 overflow-hidden rounded-xl border md:h-96'>
          {/* The event pin, plus every truck still there at its post. */}
          <MapComponent kind='deployment' position={position} markers={deployedTruckMarkers(deployment)} />
        </div>
        <DeploymentTrucks
          units={deployment.units}
          canRelease={canManage && active}
          busy={busy}
          onRelease={(u) => release.mutate({ id, truckId: u.truck.id, callSign: u.truck.callSign })}
          onSetPost={setPosting}
        />
      </div>

      <DeploymentFormDialog initial={form} onClose={() => setForm(null)} />
      {canManage && active && <TruckPickerDialog deployment={deployment} open={picking} onClose={() => setPicking(false)} />}
      <TruckPostDialog deployment={deployment} unit={posting} onClose={() => setPosting(null)} />
      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title={`End ${deployment.name}?`}
        description={`The ${stillThere} truck${stillThere === 1 ? "" : "s"} still deployed go back to Available and return to running cards.`}
        confirmLabel='End deployment'
        destructive
        onConfirm={() => end.mutate(id)}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${deployment.name}?`}
        description={
          stillThere
            ? `Its ${stillThere} deployed truck${stillThere === 1 ? "" : "s"} go back to Available first. The deployment disappears from the app; the audit log keeps a record.`
            : "The deployment disappears from the app; the audit log keeps a record."
        }
        confirmLabel='Delete'
        destructive
        onConfirm={() => remove.mutate({ id, name: deployment.name }, { onSuccess: () => navigate("/deployments", { replace: true }) })}
      />
    </Page>
  );
}

export default DeploymentDetailPage;
