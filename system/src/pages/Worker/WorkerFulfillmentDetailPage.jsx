import { StockManagerFulfillmentDetailPage } from "@/pages/StockManager/StockManagerFulfillmentDetailPage";

const DASH = "/worker";
const FULFILLMENTS = "/worker/fulfillments";

/** Chi tiết phiếu xuất — worker chỉ cập nhật bước kế tiếp, không link đơn stock-manager. */
export function WorkerFulfillmentDetailPage() {
  return (
    <StockManagerFulfillmentDetailPage
      dashboardHomeTo={DASH}
      fulfillmentsListPath={FULFILLMENTS}
      ordersPathPrefix={null}
      hideAssignWorker
      hideOrderDetailLink
      hideInventoryTxLink
      workerMode
    />
  );
}
