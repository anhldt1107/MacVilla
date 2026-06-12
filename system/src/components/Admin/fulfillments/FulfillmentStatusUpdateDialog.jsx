import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { ORDER_TIMELINE_DONE_NODE, ORDER_TIMELINE_FUTURE_NODE } from "@/config/orderStatusTheme";
import { getNextFulfillmentStatuses } from "@/lib/orderFulfillmentRules";
import {
  FULFILLMENT_STATUS_FLOW,
  getFulfillmentStatusFlowIndex,
  labelFulfillmentStatus,
  updateAdminFulfillmentStatus,
} from "@/services/admin/adminFulfillmentsApi";
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

function getFulfillmentTimelineCurrentClass(code) {
  return cn(
    "border-2 bg-background font-semibold ring-2 ring-offset-2 ring-offset-background",
    code === "Pending" &&
      "border-amber-500 bg-amber-50 text-amber-950 ring-amber-400/60 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-50 dark:ring-amber-500/50",
    code === "Picking" &&
      "border-sky-600 bg-sky-50 text-sky-950 ring-sky-500/50 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-50 dark:ring-sky-400/50",
    code === "Packed" &&
      "border-violet-600 bg-violet-50 text-violet-950 ring-violet-500/50 dark:border-violet-400 dark:bg-violet-950/50 dark:text-violet-50 dark:ring-violet-400/50",
    code === "Shipped" &&
      "border-emerald-600 bg-emerald-50 text-emerald-900 ring-emerald-500/50 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-400/50"
  );
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {{ id: number; orderCode: string; status: string; allowedFulfillmentTransitions?: string[] } | null} props.fulfillment
 * @param {string | null} props.accessToken
 * @param {(data?: object) => void} [props.onUpdated]
 * @param {boolean} [props.workerMode]
 * @param {string[]} [props.allowedTransitions]
 */
export function FulfillmentStatusUpdateDialog({
  open,
  onOpenChange,
  fulfillment,
  accessToken,
  onUpdated,
  workerMode = false,
  allowedTransitions,
}) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const selectableStatuses = useMemo(() => {
    if (!fulfillment) return [];
    const fromApi = allowedTransitions ?? fulfillment.allowedFulfillmentTransitions;
    return getNextFulfillmentStatuses(fulfillment.status, { allowedFromApi: fromApi, workerMode });
  }, [fulfillment, allowedTransitions, workerMode]);

  useEffect(() => {
    if (open && fulfillment) {
      setSelectedStatus(selectableStatuses[0] ?? "");
      setNotes("");
      setFormError("");
    }
  }, [open, fulfillment?.id, fulfillment?.status, selectableStatuses]);

  const currentIdx = fulfillment ? getFulfillmentStatusFlowIndex(fulfillment.status) : -1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken || !fulfillment || !selectedStatus) return;
    setFormError("");
    const notesTrim = notes.trim();
    if (notesTrim.length > 1000) {
      setFormError("Ghi chú tối đa 1000 ký tự.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await updateAdminFulfillmentStatus(accessToken, fulfillment.id, {
        status: selectedStatus,
        notes: notesTrim || undefined,
      });
      onUpdated?.(data);
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
          <DialogTitle>Cập nhật trạng thái phiếu công việc</DialogTitle>
          <DialogDescription>
            {fulfillment ? (
              <>
                Phiếu công việc <span className="font-mono font-semibold text-foreground">#{fulfillment.id}</span>
                {fulfillment.orderCode ? (
                  <>
                    {" "}
                    · Đơn{" "}
                    <span className="font-mono font-semibold text-foreground">{fulfillment.orderCode}</span>
                  </>
                ) : null}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {fulfillment ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tiến trình phiếu công việc
              </p>
              {currentIdx < 0 ? (
                <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
                  Trạng thái hiện tại:{" "}
                  <span className="font-mono font-medium">{fulfillment.status}</span>
                </p>
              ) : null}
              <div className="flex flex-col">
                {FULFILLMENT_STATUS_FLOW.map((code, index) => {
                  const done = currentIdx >= 0 && index < currentIdx;
                  const current = index === currentIdx;
                  const future = currentIdx < 0 || index > currentIdx;
                  const last = index === FULFILLMENT_STATUS_FLOW.length - 1;

                  return (
                    <div key={code} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                            done && ORDER_TIMELINE_DONE_NODE,
                            current && getFulfillmentTimelineCurrentClass(code),
                            future && ORDER_TIMELINE_FUTURE_NODE
                          )}
                        >
                          {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <span>{index + 1}</span>}
                        </div>
                        {!last ? (
                          <div
                            className={cn(
                              "my-0.5 min-h-[12px] w-px flex-1",
                              done || current ? "bg-teal-500/40 dark:bg-teal-600/40" : "bg-border"
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
                          {labelFulfillmentStatus(code)}
                        </span>
                        {current ? (
                          <span className="ml-2 text-xs font-normal text-teal-600 dark:text-teal-400">· hiện tại</span>
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
                <p className="text-sm text-muted-foreground">Phiếu đã hoàn tất hoặc không thể chuyển thêm.</p>
              ) : (
                <div className="space-y-2" role="radiogroup" aria-label="Trạng thái phiếu tiếp theo">
                  {selectableStatuses.map((code) => (
                    <label
                      key={code}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        selectedStatus === code
                          ? "border-teal-600 bg-teal-500/5"
                          : "border-input hover:bg-muted/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="fulfillment-status-next"
                        value={code}
                        checked={selectedStatus === code}
                        onChange={() => setSelectedStatus(code)}
                        className="h-4 w-4 accent-teal-600"
                      />
                      <span className="font-medium">{labelFulfillmentStatus(code)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="fulfillment-status-notes" className="text-sm font-medium">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                id="fulfillment-status-notes"
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú nội bộ khi đổi trạng thái…"
                className={cn(
                  "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
              <p className="text-[11px] text-muted-foreground">{notes.length}/1000</p>
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
