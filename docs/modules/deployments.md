# deployments module

`backend/src/deployments/` · API: [deployments](../api/deployments.md). Imports `NotificationsModule`; uses the global `PrismaModule` and `AuditModule`.

Special deployments are planned events (ASEAN summit, SONA, …) the **Regional Operations** office sends trucks to, from any city. A truck on a deployment has `status = DEPLOYED`. The running card and dispatch only take `AVAILABLE` trucks, so a deployed truck is never on a card or sent to a fire until it is released.

- `DeploymentsService`
  - `list(status?)`, `get(id)`: anyone signed in (offices see where their trucks went).
  - `create(user, dto)`: the deployment, plus optional `truckIds`, in one transaction.
  - `update(user, id, dto)`: details only, while `ACTIVE`; `endsAt` may not be before `startsAt`.
  - `assign(user, id, truckIds)`: each truck is claimed with a conditional update `AVAILABLE → DEPLOYED`. One truck that isn't available (responding, out of service, already deployed) fails the whole step with 409, so nothing is half-assigned.
  - `setPost(user, id, truckId, dto)`: where one truck stands within the event (`postLabel`, `postLat`, `postLng`, e.g. Engine A at Quiapo Church). A truck without a post stands at the deployment's location. Changeable while the truck is there; audited as `SET_POST`.
  - `release(user, id, truckId)`: one truck `DEPLOYED → AVAILABLE`; the `DeploymentUnit` keeps `releasedAt` / `releasedById`.
  - `end(user, id)`: releases every truck still there and sets `ENDED` (conditional, so it ends once).
  - `remove(user, id)`: soft delete (`deletedAt`), active or ended. Trucks still there are released first (`DEPLOYMENT_RELEASED` notification); an active one is also marked `ENDED`. Deleted deployments are left out of `list`, and `get` and every change return 404. Audited as `DELETE` with the name and released trucks.
  - Every step writes an audit entry (`Deployment`: `CREATE`, `UPDATE`, `ASSIGN`, `RELEASE`, `END`) and, when trucks move, one notification (`DEPLOYMENT_ASSIGNED` / `DEPLOYMENT_RELEASED`) in the same transaction, published after commit. The notification goes to the cities of the moved trucks; the Regional office sees all.
- `StationsService` guards deployed trucks: their status can't be changed and they can't be removed by station editors (409). `DEPLOYED` is not in `TRUCK_STATUSES`, so it can't be set by hand. The stations list includes each truck's current deployment (`deploymentUnits[0].deployment { id, name }`).

There is no timer: `startsAt` / `endsAt` are planned dates for information. Trucks return only when released or when the deployment is ended.

Frontend:
- `pages/DeploymentsPage.jsx` (Active / Ended, New deployment) and `pages/DeploymentDetailPage.jsx`;
- `components/features/deployments/` (`DeploymentFormDialog`, `TruckPickerDialog`, `TruckPostDialog`, `list/`, `detail/`); the detail map shows the event pin and every truck still there at its post (`utils/deploymentMap.js`);
- `hooks/deployments/`, `service/deployment.service.js`;
- `canManageDeployments` in `utils/permissions.js`;
- `components/features/stations/TruckStatusControl.jsx` shows "Deployed: <event>" instead of the status menu.
