/** Nhãn tiếng Việt cho trạng thái báo giá (pipeline / funnel / time-in-stage). */
export const QUOTE_STATUS_VI = {
  Requested: "Đã yêu cầu",
  Draft: "Nháp",
  PendingApproval: "Chờ duyệt",
  Approved: "Đã duyệt",
  CustomerAccepted: "KH chấp nhận",
  CustomerRejected: "KH từ chối",
  Converted: "Đã chuyển đơn",
  Rejected: "Từ chối",
  Expired: "Hết hạn",
  Cancelled: "Đã hủy",
  CounterOffer: "Thương lượng",
};

/**
 * @param {string | undefined | null} status
 * @returns {string}
 */
export function labelQuoteStatus(status) {
  if (!status) return "—";
  if (QUOTE_STATUS_VI[status]) return QUOTE_STATUS_VI[status];
  const lower = String(status).toLowerCase();
  if (lower === "cancelled" || lower === "canceled") return "Đã hủy";
  return String(status);
}
