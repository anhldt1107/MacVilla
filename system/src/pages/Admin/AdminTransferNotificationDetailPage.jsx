import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchAdminTransferNotificationDetail,
  labelAdminTransferNotificationStatus,
  rejectAdminTransferNotification,
  transferNotificationStatusBadgeClass,
  verifyAdminTransferNotification,
} from "@/services/admin/adminTransferNotificationsApi";
import { fetchAdminInvoiceDetail } from "@/services/admin/adminInvoicesApi";
import { ChevronRight, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

function isPendingStatus(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase() === "pending";
}

export function AdminTransferNotificationDetailPage() {
  const { id: idParam } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();
  const isSalesShell = paths.shell === "saler";
  const id = String(idParam ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  const [invoiceRemaining, setInvoiceRemaining] = useState(/** @type {number|null} */ (null));
  const [invoiceRemainingLoading, setInvoiceRemainingLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const d = await fetchAdminTransferNotificationDetail(accessToken, id);
      setDetail(d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết thông báo.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const detailInvoiceId = detail ? pick(detail, "invoiceId", "InvoiceId") : null;

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setInvoiceRemaining(null);
      return;
    }
    const rawId = detailInvoiceId;
    const iidNum = rawId != null && Number.isFinite(Number(rawId)) ? Number(rawId) : null;
    if (iidNum == null || iidNum < 1) {
      setInvoiceRemaining(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setInvoiceRemainingLoading(true);
      try {
        const inv = await fetchAdminInvoiceDetail(accessToken, iidNum);
        if (cancelled) return;
        const rem = pick(inv, "remainingAmount", "RemainingAmount");
        setInvoiceRemaining(rem != null && Number.isFinite(Number(rem)) ? Number(rem) : null);
      } catch {
        if (!cancelled) setInvoiceRemaining(null);
      } finally {
        if (!cancelled) setInvoiceRemainingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, detailInvoiceId, isAuthenticated]);

  const st = detail ? pick(detail, "status", "Status") : null;
  const pending = isPendingStatus(st != null ? String(st) : "");

  const submitVerify = async () => {
    if (!accessToken || !id || verifySubmitting) return;
    setVerifySubmitting(true);
    setVerifyError("");
    try {
      const note = verifyNote.trim();
      await verifyAdminTransferNotification(accessToken, id, note ? { processNote: note } : {});
      setVerifyOpen(false);
      setVerifyNote("");
      await load();
    } catch (e) {
      setVerifyError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Xác nhận thất bại.");
    } finally {
      setVerifySubmitting(false);
    }
  };

  const submitReject = async () => {
    if (!accessToken || !id || rejectSubmitting) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Nhập lý do từ chối.");
      return;
    }
    setRejectSubmitting(true);
    setRejectError("");
    try {
      await rejectAdminTransferNotification(accessToken, id, { reason });
      setRejectOpen(false);
      setRejectReason("");
      await load();
    } catch (e) {
      setRejectError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Từ chối thất bại.");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const copyRef = async () => {
    const refc = detail ? pick(detail, "referenceCode", "ReferenceCode") : null;
    const t = refc != null ? String(refc) : "";
    if (!t || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      /* ignore */
    }
  };

  const amt = detail ? pick(detail, "amount", "Amount") : null;
  const refc = detail ? pick(detail, "referenceCode", "ReferenceCode") : null;
  const note = detail ? pick(detail, "note", "Note") : null;
  const att = detail ? pick(detail, "attachmentUrl", "AttachmentUrl") : null;
  const cid = detail ? pick(detail, "customerId", "CustomerId") : null;
  const cname = detail ? pick(detail, "customerName", "CustomerName") : null;
  const company = detail ? pick(detail, "companyName", "CompanyName") : null;
  const iid = detail ? pick(detail, "invoiceId", "InvoiceId") : null;
  const invNum = detail ? pick(detail, "invoiceNumber", "InvoiceNumber") : null;
  const created = detail ? pick(detail, "createdAt", "CreatedAt") : null;
  const procNote = detail ? pick(detail, "processNote", "ProcessNote") : null;
  const procBy = detail ? pick(detail, "processedByName", "ProcessedByName") : null;
  const procAt = detail ? pick(detail, "processedAt", "ProcessedAt") : null;

  const notifyAmount = amt != null && Number.isFinite(Number(amt)) ? Number(amt) : null;
  const exceedsRemaining =
    notifyAmount != null &&
    invoiceRemaining != null &&
    invoiceRemaining > 0 &&
    notifyAmount > invoiceRemaining;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to={paths.root} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={paths.transferNotificationsList} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Thông báo CK
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="px-1.5 font-semibold text-slate-800 dark:text-slate-200">#{id || "—"}</span>
      </nav>

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
          <div className="mt-3">
            <Button variant="outline" size="sm" asChild>
              <Link to={paths.transferNotificationsList}>Về danh sách</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Thông báo CK #{id}</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{formatDateTime(created != null ? String(created) : "")}</p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  transferNotificationStatusBadgeClass(st != null ? String(st) : "")
                )}
              >
                {labelAdminTransferNotificationStatus(st != null ? String(st) : "")}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-200">{formatMoneyVnd(amt)}</p>
          </header>

          {pending && iid != null && !invoiceRemainingLoading ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                exceedsRemaining
                  ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                  : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
              )}
              role="status"
            >
              {invoiceRemaining != null ? (
                <>
                  <span className="font-medium">Số còn lại hóa đơn: {formatMoneyVnd(invoiceRemaining)}</span>
                  {exceedsRemaining ? (
                    <p className="mt-1 text-amber-900 dark:text-amber-200">
                      Số tiền vượt số còn lại — sẽ bị từ chối khi xác nhận.
                    </p>
                  ) : null}
                </>
              ) : (
                <span className="text-slate-600 dark:text-slate-400">Không tải được số còn lại hóa đơn.</span>
              )}
            </div>
          ) : null}

          {pending && !isSalesShell ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => { setVerifyError(""); setVerifyNote(""); setVerifyOpen(true); }}>
                Xác nhận đối soát
              </Button>
              <Button type="button" variant="outline" onClick={() => { setRejectError(""); setRejectReason(""); setRejectOpen(true); }}>
                Từ chối
              </Button>
            </div>
          ) : null}
          {pending && isSalesShell ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Đang chờ đối soát — bạn chỉ xem tại đây.</p>
          ) : null}

          <div className="grid gap-6">
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Nội dung</CardTitle>
                <CardDescription>Khách, tham chiếu, ghi chú gửi kèm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Khách</span>
                  <span className="text-right">
                    {cid != null ? (
                      <Link className="font-medium text-violet-700 hover:underline dark:text-violet-400" to={`${paths.sales}/customers/${encodeURIComponent(String(cid))}`}>
                        {cname != null ? String(cname) : `Khách #${cid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                {company != null ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Công ty</span>
                    <span className="text-right font-medium">{String(company)}</span>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-500">Mã tham chiếu</span>
                  <div className="flex max-w-[min(100%,420px)] flex-wrap items-center justify-end gap-2">
                    <span className="break-all font-mono text-xs">{refc != null ? String(refc) : "—"}</span>
                    {refc != null ? (
                      <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs" onClick={() => void copyRef()}>
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        Sao chép
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Hóa đơn</span>
                  <span className="text-right">
                    {iid != null ? (
                      <Link className="font-mono text-violet-700 hover:underline dark:text-violet-400" to={`${paths.invoicesList}/${encodeURIComponent(String(iid))}`}>
                        {invNum != null ? String(invNum) : `#${iid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                {iid != null ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Còn lại HĐ</span>
                    <span className="text-right font-medium text-amber-800 dark:text-amber-200">
                      {invoiceRemainingLoading ? "Đang tải…" : invoiceRemaining != null ? formatMoneyVnd(invoiceRemaining) : "—"}
                    </span>
                  </div>
                ) : null}
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-slate-500">Ghi chú khách</span>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{note != null ? String(note) : "—"}</p>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Chứng từ</span>
                  <span className="text-right">
                    {att != null && String(att).trim() ? (
                      <a
                        href={String(att)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-violet-700 hover:underline dark:text-violet-400"
                      >
                        Mở file
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {!pending ? (
              <Card className="border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base">Xử lý</CardTitle>
                  <CardDescription>Ghi chú / người xử lý</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {procBy != null ? (
                    <p>
                      <span className="text-slate-500">Bởi: </span>
                      <span className="font-medium">{String(procBy)}</span>
                    </p>
                  ) : null}
                  {procAt != null ? <p className="text-xs text-slate-600 dark:text-slate-400">{formatDateTime(String(procAt))}</p> : null}
                  <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="text-slate-500">Ghi chú xử lý</span>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{procNote != null ? String(procNote) : "—"}</p>
                  </div>
                  <p className="pt-2 text-xs text-slate-500">
                    Sau khi xác nhận, có thể xem giao dịch tại{" "}
                    <Link className="text-violet-700 hover:underline dark:text-violet-400" to={paths.paymentsList}>
                      Thanh toán
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </>
      ) : null}

      <Dialog
        open={verifyOpen}
        onOpenChange={(o) => {
          setVerifyOpen(o);
          if (!o) {
            setVerifyError("");
            setVerifyNote("");
          }
        }}
      >
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => verifySubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Xác nhận đối soát</DialogTitle>
            <DialogDescription className="space-y-2 text-left text-sm text-slate-700 dark:text-slate-300">
              <span className="block font-medium text-amber-900 dark:text-amber-100">
                Xác nhận thanh toán chuyển khoản; cập nhật hóa đơn và công nợ. Không hoàn tác trên màn này.
              </span>
              {iid != null && invoiceRemaining != null ? (
                <span className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                  Hóa đơn {invNum != null ? String(invNum) : `#${iid}`}: còn lại{" "}
                  <strong>{formatMoneyVnd(invoiceRemaining)}</strong>
                  {notifyAmount != null ? (
                    <>
                      {" "}
                      · Thông báo: <strong>{formatMoneyVnd(notifyAmount)}</strong>
                    </>
                  ) : null}
                </span>
              ) : null}
              {exceedsRemaining ? (
                <span className="block font-medium text-red-700 dark:text-red-300" role="alert">
                  Số tiền thông báo vượt số còn lại — xác nhận sẽ bị từ chối.
                </span>
              ) : null}
              <span className="block">Tuỳ chọn: ghi chú đối soát (tối đa 2000 ký tự).</span>
            </DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
            placeholder="VD: Đã khớp sao kê…"
            value={verifyNote}
            onChange={(e) => setVerifyNote(e.target.value)}
            disabled={verifySubmitting}
          />
          {verifyError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {verifyError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={verifySubmitting} onClick={() => setVerifyOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={verifySubmitting} onClick={() => void submitVerify()}>
              {verifySubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(o) => {
          setRejectOpen(o);
          if (!o) {
            setRejectError("");
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => rejectSubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Từ chối thông báo</DialogTitle>
            <DialogDescription>Chỉ trạng thái Pending. Bắt buộc nhập lý do (lưu vào ghi chú xử lý).</DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
            placeholder="Lý do từ chối…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={rejectSubmitting}
          />
          {rejectError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {rejectError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
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
    </div>
  );
}
