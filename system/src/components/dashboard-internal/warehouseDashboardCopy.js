/** Copy tiếng Việt cho dashboard kho — theo copy-guidelines. */

export const WAREHOUSE_DASHBOARD_COPY = {
  pageTitle: "Tồn kho & vận hành",
  sectionInventory: "Tồn kho",
  sectionOrderStatus: "Đơn (trạng thái)",
  sectionFulfillment: "Phiếu xuất kho",
  sectionInventoryTx: "Giao dịch kho",
  sectionSla: "Thời gian xác nhận → giao hàng",
  sectionLateOrders: "Đơn trễ",
  sectionLowStock: "SKU tồn thấp",
  sectionTopMoving: "SKU bán chạy",
  kpiSkuActive: "SKU đang bán",
  kpiLowStock: "Cảnh báo tồn thấp",
  kpiOnHand: "Tồn",
  kpiReserved: "Giữ chỗ",
  kpiStockValue: "GT tồn",
  kpiSlaAvg: "Trung bình (giờ)",
  kpiSlaP50: "Phân vị 50%",
  kpiSlaP90: "Phân vị 90%",
  colDaysCover: "Đủ dùng (ngày)",
  colSales: "NV bán hàng",
  linkFulfillments: "Phiếu xuất",
  linkInventory: "Tồn kho",
  noLateOrders: "Không có đơn trễ.",
};

export const WAREHOUSE_QUEUE_COPY = {
  pendingFulfillments: "Phiếu chờ xử lý",
  ordersWithoutTicket: "Đơn chưa có phiếu xuất",
  returnsApproved: "Đổi trả chờ kho",
  lowStockSkus: "SKU tồn thấp",
  workerTicketsOf: (name) => `Phiếu của: ${name}`,
};

export const WORKER_QUEUE_COPY = {
  empty: "Chưa có phiếu được giao",
  openTicket: "Mở phiếu",
};
