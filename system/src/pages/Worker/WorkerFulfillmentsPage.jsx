import { useAuth } from "@/context/AuthContext";
import { StockManagerFulfillmentsPage } from "@/pages/StockManager/StockManagerFulfillmentsPage";

const WORKER_FULFILLMENTS = "/worker/fulfillments";

/**
 * Phiếu xuất gán cho tài khoản hiện tại; filter `assignedWorkerId` qua API.
 */
export function WorkerFulfillmentsPage() {
  const { user } = useAuth();
  const id = user?.id != null ? String(user.id) : "";

  return (
    <StockManagerFulfillmentsPage
      initialAssignedWorkerId={id}
      fulfillmentsBasePath={WORKER_FULFILLMENTS}
      ordersPathPrefix={null}
      fullFulfillmentsPath={WORKER_FULFILLMENTS}
      hideOrderLinks
      hideAssignWorker
      workerMode
    />
  );
}
