import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  getPaymentStatusTimelineCurrentClass,
  ORDER_TIMELINE_DONE_NODE,
  ORDER_TIMELINE_FUTURE_NODE,
} from "@/config/orderStatusTheme";
import {
  ADMIN_PAYMENT_STATUS_FLOW,
  getPaymentStatusFlowIndex,
  labelPaymentStatus,
  updateAdminOrderPaymentStatus,
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
 * @param {{ id: number; orderCode: string; paymentStatus: string } | null} props.order
 * @param {string | null} props.accessToken
 * @param {() => void} props.onUpdated
 */
export function PaymentStatusUpdateDialog({ open, onOpenChange, order, accessToken, onUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open && order) {
      const raw = order.paymentStatus || "";
      const normalized = raw === "UnPaid" ? "Unpaid" : raw;
      const inFlow = ADMIN_PAYMENT_STATUS_FLOW.includes(normalized);
      setSelectedStatus(inFlow ? normalized : ADMIN_PAYMENT_STATUS_FLOW[0]);
      setNote("");
      setFormError("");
    }
  }, [open, order?.id, order?.paymentStatus]);

  const currentIdx = order ? getPaymentStatusFlowIndex(order.paymentStatus) : -1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken || !order) return;
    setFormError("");
    setSubmitting(true);
    try {
      await updateAdminOrderPaymentStatus(accessToken, order.id, {
        paymentStatus: selectedStatus,
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
          <DialogTitle>Cập nhật trạng thái thanh toán</DialogTitle>
          <DialogDescription>
            {order ? (
              <>
                Mã đơn: <span className="font-mono font-semibold text-foreground">{order.orderCode}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {order ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tiến trình thanh toán
              </p>
              {currentIdx < 0 ? (
                <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
                  Trạng thái hiện tại:{" "}
                  <span className="font-mono font-medium">{order.paymentStatus || "—"}</span> (không nằm trong chuẩn
                  timeline — vẫn có thể chọn trạng thái mới bên dưới).
                </p>
              ) : null}
              <div className="flex flex-col">
                {ADMIN_PAYMENT_STATUS_FLOW.map((code, index) => {
                  const done = currentIdx >= 0 && index < currentIdx;
                  const current = index === currentIdx;
                  const future = currentIdx < 0 || index > currentIdx;
                  const last = index === ADMIN_PAYMENT_STATUS_FLOW.length - 1;

                  return (
                    <div key={code} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                            done && ORDER_TIMELINE_DONE_NODE,
                            current && getPaymentStatusTimelineCurrentClass(code),
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
                          {labelPaymentStatus(code)}
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
              <label htmlFor="payment-status-select" className="text-sm font-medium">
                Chọn trạng thái cập nhật
              </label>
              <select
                id="payment-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {ADMIN_PAYMENT_STATUS_FLOW.map((code) => (
                  <option key={code} value={code}>
                    {labelPaymentStatus(code)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="payment-status-note" className="text-sm font-medium">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                id="payment-status-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú nội bộ khi đổi trạng thái thanh toán…"
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
                {submitting ? "Đang cập nhật…" : "Cập nhật thanh toán"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
