import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  adminReturnStatusBadgeClass,
  approveAdminReturn,
  fetchAdminReturnDetail,
  fetchAdminReturnStatuses,
  fetchAdminReturnTypes,
  labelAdminReturnStatus,
  labelAdminReturnType,
  rejectAdminReturn,
} from "@/services/admin/adminReturnsApi";
import { ReturnStatusStepper } from "@/components/returns/ReturnStatusStepper";
import { ReturnDetailActions } from "@/components/returns/ReturnDetailActions";
import { ReturnItemsTable } from "@/components/returns/ReturnItemsTable";
import { ChevronRight, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const RETURNS_LIST = "/manager/after-sales/returns";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function lineItemId(row) {
  const o = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
  const id = o.returnItemId ?? o.ReturnItemId ?? o.id ?? o.Id;
  return id != null && Number.isFinite(Number(id)) ? Number(id) : null;
}

export function ManagerReturnDetailPage() {
  const { id: idParam } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const id = String(idParam ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [returnStatusOptions, setReturnStatusOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveRefund, setApproveRefund] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approveError, setApproveError] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ returnStatuses }, types] = await Promise.all([
          fetchAdminReturnStatuses(accessToken),
          fetchAdminReturnTypes(accessToken),
        ]);
        if (!cancelled) {
          setReturnStatusOptions(returnStatuses.filter((o) => o.value));
          setTypeOptions(types.filter((o) => o.value));
        }
      } catch {
        if (!cancelled) {
          setReturnStatusOptions([]);
          setInventoryActionOptions([]);
          setTypeOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const d = await fetchAdminReturnDetail(accessToken, id);
      const rec = d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null;
      setDetail(rec);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được phiếu.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const num = detail ? pick(detail, "ticketNumber", "TicketNumber") ?? pick(detail, "returnNumber", "ReturnNumber") : null;
  const st = detail ? String(pick(detail, "status", "Status") ?? "") : "";
  const ty = detail ? String(pick(detail, "type", "Type") ?? "") : "";
  const oid = detail ? pick(detail, "orderId", "OrderId") : null;
  const cid = detail ? pick(detail, "customerId", "CustomerId") : null;
  const cname = detail ? pick(detail, "customerName", "CustomerName") : null;
  const reason = detail ? pick(detail, "reason", "Reason") : null;
  const customerNote = detail ? pick(detail, "customerNote", "CustomerNote") : null;
  const internalNote = detail ? pick(detail, "internalNote", "InternalNote") : null;
  const refundAmount = detail ? pick(detail, "refundAmount", "RefundAmount") : null;
  const rejectReasonDoc = detail ? pick(detail, "rejectReason", "RejectReason") : null;
  const created = detail ? pick(detail, "createdAt", "CreatedAt") : null;
  const lineItems = useMemo(() => {
    const raw = detail ? pick(detail, "items", "Items") : null;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const paymentsUrl = useMemo(() => {
    const q = new URLSearchParams();
    if (cid != null && Number.isFinite(Number(cid))) {
      q.set("customerId", String(cid));
    }
    if (oid != null && Number.isFinite(Number(oid))) {
      q.set("orderId", String(oid));
    }
    const base = "/manager/accounting/payments";
    const qs = q.toString();
    return qs ? `${base}?${qs}` : base;
  }, [cid, oid]);

  const submitApprove = async () => {
    if (!accessToken || !id || approveSubmitting) return;
    const amt = Number(String(approveRefund).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(amt) || amt < 0) {
      setApproveError("Nhập số tiền hoàn hợp lệ (≥ 0).");
      return;
    }
    setApproveSubmitting(true);
    setApproveError("");
    try {
      /** @type {Record<string, unknown>} */
      const body = { refundAmount: amt };
      const n = approveNote.trim();
      if (n) body.internalNote = n;
      const updated = await approveAdminReturn(accessToken, id, body);
      setDetail(updated && typeof updated === "object" ? /** @type {Record<string, unknown>} */ (updated) : detail);
      setApproveOpen(false);
      setApproveRefund("");
      setApproveNote("");
    } catch (e) {
      setApproveError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Duyệt thất bại.");
    } finally {
      setApproveSubmitting(false);
    }
  };

  const submitReject = async () => {
    if (!accessToken || !id || rejectSubmitting) return;
    setRejectSubmitting(true);
    setRejectError("");
    try {
      const body = {};
      const r = rejectReason.trim();
      if (r) body.rejectReason = r;
      const updated = await rejectAdminReturn(accessToken, id, body);
      setDetail(updated && typeof updated === "object" ? /** @type {Record<string, unknown>} */ (updated) : detail);
      setRejectOpen(false);
      setRejectReason("");
    } catch (e) {
      setRejectError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Từ chối thất bại.");
    } finally {
      setRejectSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/manager" className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={RETURNS_LIST} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Đổi trả
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="px-1.5 font-semibold text-slate-800 dark:text-slate-200">{num != null ? String(num) : `#${id}`}</span>
      </nav>

      <Dialog open={approveOpen} onOpenChange={(o) => { setApproveOpen(o); if (!o) setApproveError(""); }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => approveSubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Duyệt phiếu</DialogTitle>
            <DialogDescription>Xác nhận duyệt phiếu đổi/trả.</DialogDescription>
          </DialogHeader>
          <p className="text-xs text-amber-900/90 dark:text-amber-100/90">Kiểm tra số tiền hoàn trước khi gửi.</p>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="ap-ref">
                Tổng tiền hoàn <span className="text-red-600">*</span>
              </label>
              <input
                id="ap-ref"
                type="text"
                inputMode="decimal"
                className={fieldInput}
                value={approveRefund}
                onChange={(e) => setApproveRefund(e.target.value)}
                disabled={approveSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="ap-note">
                Ghi chú nội bộ
              </label>
              <textarea
                id="ap-note"
                rows={2}
                className={cn(fieldInput, "min-h-[72px] resize-y py-2")}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                disabled={approveSubmitting}
              />
            </div>
          </div>
          {approveError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {approveError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={approveSubmitting} onClick={() => setApproveOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={approveSubmitting} onClick={() => void submitApprove()}>
              {approveSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={(o) => { setRejectOpen(o); if (!o) setRejectError(""); }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => rejectSubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Từ chối phiếu</DialogTitle>
            <DialogDescription>Từ chối phiếu đổi/trả.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rj-r">
              Lý do từ chối
            </label>
            <textarea
              id="rj-r"
              rows={3}
              className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={rejectSubmitting}
            />
          </div>
          {rejectError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {rejectError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={rejectSubmitting} onClick={() => setRejectOpen(false)}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" disabled={rejectSubmitting} onClick={() => void submitReject()}>
              {rejectSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && !detail ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600/70" aria-hidden />
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {num != null ? String(num) : `Phiếu #${id}`}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    adminReturnStatusBadgeClass(st)
                  )}
                >
                  {labelAdminReturnStatus(st, returnStatusOptions)}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {labelAdminReturnType(ty, typeOptions)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {oid != null ? (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <Link to={`/manager/sales/orders/${encodeURIComponent(String(oid))}`}>Đơn #{oid}</Link>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link to={paymentsUrl}>
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Thanh toán
                </Link>
              </Button>
            </div>
          </header>

          <ReturnStatusStepper status={st} statusOptions={returnStatusOptions} />

          <ReturnDetailActions
            roleShell="manager"
            status={st}
            busy={approveSubmitting || rejectSubmitting}
            onApproveClick={() => {
              setApproveError("");
              setApproveOpen(true);
            }}
            onRejectClick={() => {
              setRejectError("");
              setRejectOpen(true);
            }}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Khách</span>
                  <span className="text-right font-medium">
                    {cid != null ? (
                      <Link className="text-violet-700 hover:underline dark:text-violet-400" to={`/manager/sales/customers/${encodeURIComponent(String(cid))}`}>
                        {cname != null ? String(cname) : `#${cid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Tạo lúc</span>
                  <span>{formatDateTime(created != null ? String(created) : "")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Hoàn tiền (đã duyệt)</span>
                  <span className="font-semibold tabular-nums">{formatMoneyVnd(refundAmount)}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-slate-500">Lý do</span>
                  <p className="mt-1 text-slate-800 dark:text-slate-200">{reason != null ? String(reason) : "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Ghi chú khách</span>
                  <p className="mt-1 text-slate-800 dark:text-slate-200">{customerNote != null ? String(customerNote) : "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Ghi chú nội bộ</span>
                  <p className="mt-1 text-slate-800 dark:text-slate-200">{internalNote != null ? String(internalNote) : "—"}</p>
                </div>
                {rejectReasonDoc != null && String(rejectReasonDoc).trim() ? (
                  <div className="rounded-md border border-rose-200/80 bg-rose-50/50 px-3 py-2 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-100">
                    <span className="text-xs font-semibold uppercase">Lý do từ chối</span>
                    <p className="mt-1 text-sm">{String(rejectReasonDoc)}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Dòng hàng</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ReturnItemsTable items={lineItems} showOrderItemId />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
