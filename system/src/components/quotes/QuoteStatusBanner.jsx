/**
 * Một dòng trạng thái báo giá — thay nhiều đoạn text-xs lặp trên chi tiết báo giá.
 * @param {{ status?: string, isSalesShell?: boolean }} props
 */
export function QuoteStatusBanner({ status, isSalesShell = false }) {
  const st = String(status ?? "");
  let message = null;

  if (st === "PendingApproval" && isSalesShell) {
    message = "Đang chờ quản lý duyệt.";
  } else if (st === "Approved" && isSalesShell) {
    message = "Đã duyệt — chờ khách xác nhận trên cổng B2B.";
  } else if (st === "CounterOffer" && isSalesShell) {
    message = "Khách đã phản hồi — chỉnh sửa và gửi lại.";
  }

  if (!message) return null;

  return (
    <p className="pt-1 text-xs text-slate-600 dark:text-slate-400 sm:max-w-xl">{message}</p>
  );
}
