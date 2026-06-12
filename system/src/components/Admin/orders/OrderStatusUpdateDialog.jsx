import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  getOrderStatusTimelineCurrentClass,
  ORDER_TIMELINE_DONE_NODE,
  ORDER_TIMELINE_FUTURE_NODE,
} from "@/config/orderStatusTheme";
import { getNextOrderStatuses } from "@/lib/orderFulfillmentRules";
import {
  ADMIN_ORDER_STATUS_FLOW,
  getOrderStatusFlowIndex,
  labelOrderStatus,
  updateAdminOrderStatus,
} from "@/services/admin/adminOrdersApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {{ id: number; orderCode: string; orderStatus: string; workflow?: { allowedOrderTransitions?: string[] } } | null} props.order
 * @param {string | null} props.accessToken
 * @param {() => void} props.onUpdated
 * @param {string} [props.shell] admin | manager | saler
 * @param {string[]} [props.allowedTransitions]
 */
export function OrderStatusUpdateDialog({
  open,
  onOpenChange,
  order,
  accessToken,
  onUpdated,
  shell,
  allowedTransitions,
}) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const selectableStatuses = useMemo(() => {
    if (!order) return [];
    const fromApi = allowedTransitions ?? order.workflow?.allowedOrderTransitions;
    return getNextOrderStatuses(order.orderStatus, { allowedFromApi: fromApi, shell });
  }, [order, allowedTransitions, shell]);

  useEffect(() => {
    if (open && order) {
      setSelectedStatus(selectableStatuses[0] ?? "");
      setNote("");
      setFormError("");
    }
  }, [open, order?.id, order?.orderStatus, selectableStatuses]);

  const currentIdx = order ? getOrderStatusFlowIndex(order.orderStatus) : -1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken || !order || !selectedStatus) return;
    setFormError("");
    setSubmitting(true);
    try {
      await updateAdminOrderStatus(accessToken, order.id, {
        status: selectedStatus,
        note,
      });
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Cập nhật thất bại.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái đơn</DialogTitle>
          <DialogDescription>
            {order ? (
              <>
                Mã đơn: <span className="font-mono font-semibold text-foreground">{order.orderCode}</span>
                {shell === "saler" ? (
                  <span className="mt-1 block text-slate-600 dark:text-slate-400">
                    Xác nhận khách đã nhận hàng (chỉ đơn bạn phụ trách).
                  </span>
                ) : null}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {order ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tiến trình đơn hàng
              </p>
              {currentIdx < 0 ? (
                <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
                  Trạng thái hiện tại:{" "}
                  <span className="font-medium">{order.orderStatus}</span>
                </p>
              ) : null}
              <div className="flex flex-col">
                {ADMIN_ORDER_STATUS_FLOW.map((code, index) => {
                  const done = currentIdx >= 0 && index < currentIdx;
                  const current = index === currentIdx;
                  const future = currentIdx < 0 || index > currentIdx;
                  const last = index === ADMIN_ORDER_STATUS_FLOW.length - 1;

                  return (
                    <div key={code} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                            done && ORDER_TIMELINE_DONE_NODE,
                            current && getOrderStatusTimelineCurrentClass(code),
                            future && ORDER_TIMELINE_FUTURE_NODE
                          )}
                        >
                          {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <span>{index + 1}</span>}
                        </div>
                        {!last ? (
                          <div
                            className={cn(
                              "my-0.5 min-h-[12px] w-px flex-1",
                              done || current ? "bg-emerald-500/35 dark:bg-emerald-600/35" : "bg-border"
                            )}
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className={cn("min-w-0 flex-1 pb-5 pt-1.5 text-sm", last && "pb-0")}>
                        <span
                          className={cn(
                            current && "font-semibold text-foreground",
                            done && "text-muted-foreground",
                            future && "text-muted-foreground/80"
                          )}
                        >
                          {labelOrderStatus(code)}
                        </span>
                        {current ? (
                          <span className="ml-2 text-xs font-normal text-primary">· hiện tại</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Chọn bước tiếp theo</p>
              {selectableStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Không có bước cập nhật thủ công phù hợp — trạng thái kho được đồng bộ tự động từ phiếu công việc.
                </p>
              ) : (
                <div className="space-y-2" role="radiogroup" aria-label="Trạng thái đơn tiếp theo">
                  {selectableStatuses.map((code) => (
                    <label
                      key={code}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        selectedStatus === code
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-muted/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="order-status-next"
                        value={code}
                        checked={selectedStatus === code}
                        onChange={() => setSelectedStatus(code)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="font-medium">{labelOrderStatus(code)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="order-status-note" className="text-sm font-medium">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                id="order-status-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú nội bộ khi đổi trạng thái…"
                className={cn(
                  "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>

            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting || !selectedStatus}>
                {submitting ? "Đang cập nhật…" : "Cập nhật trạng thái"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
