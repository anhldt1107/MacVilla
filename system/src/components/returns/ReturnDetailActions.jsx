import {
  returnAllowsApproveReject,
  returnAllowsComplete,
  returnAllowsReceive,
  returnAllowsStartProcessing,
  returnShowsWarehouseHandoffHint,
} from "@/services/admin/adminReturnsApi";
import { Button } from "@/components/ui/button";

/**
 * Nút hành động phiếu đổi/trả theo vai trò shell.
 *
 * @param {{
 *   roleShell: "admin" | "manager" | "stock" | "saler"
 *   status?: string | null
 *   busy?: boolean
 *   canApproveReject?: boolean
 *   onApproveClick?: () => void
 *   onRejectClick?: () => void
 *   onStartProcessing?: () => void
 *   onReceiveItems?: () => void
 *   onCompleteClick?: () => void
 * }} props
 */
export function ReturnDetailActions({
  roleShell,
  status = "",
  busy = false,
  canApproveReject = true,
  onApproveClick,
  onRejectClick,
  onStartProcessing,
  onReceiveItems,
  onCompleteClick,
}) {
  const st = String(status ?? "");
  const isSaler = roleShell === "saler";
  const isStock = roleShell === "stock";
  const isMgrShell = roleShell === "manager" || roleShell === "admin";

  const showApproveReject =
    returnAllowsApproveReject(st) && isMgrShell && !isSaler && canApproveReject;
  const showWarehouseHint = returnShowsWarehouseHandoffHint(st) && isMgrShell && !isSaler;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {showApproveReject ? (
          <>
            <Button type="button" size="sm" disabled={busy} onClick={onApproveClick}>
              Duyệt
            </Button>
            <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={onRejectClick}>
              Từ chối
            </Button>
          </>
        ) : null}
        {isStock && returnAllowsStartProcessing(st) ? (
          <Button size="sm" disabled={busy} onClick={onStartProcessing}>
            Bắt đầu thu hồi
          </Button>
        ) : null}
        {isStock && returnAllowsReceive(st) ? (
          <Button size="sm" disabled={busy} onClick={onReceiveItems}>
            Đã nhận hàng
          </Button>
        ) : null}
        {isStock && returnAllowsComplete(st) ? (
          <Button size="sm" disabled={busy} onClick={onCompleteClick}>
            Hoàn tất phiếu
          </Button>
        ) : null}
      </div>
      {showWarehouseHint ? (
        <p className="rounded-lg border border-sky-200/80 bg-sky-50/60 px-3 py-2 text-xs text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/25 dark:text-sky-100">
          Bước tiếp theo do bộ phận kho xử lý.
        </p>
      ) : null}
    </>
  );
}
