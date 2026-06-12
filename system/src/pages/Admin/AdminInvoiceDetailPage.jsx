import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  cancelAdminInvoice,
  fetchAdminInvoiceDetail,
  fetchAdminInvoiceStatuses,
  canRequestAdminInvoiceCancel,
  invoiceStatusBadgeClass,
  isAdminInvoiceVatEditable,
  labelAdminInvoiceStatus,
  updateAdminInvoice,
} from "@/services/admin/adminInvoicesApi";
import { ChevronRight, CreditCard, ExternalLink, Loader2, Save, XCircle } from "lucide-react";
import { DocumentUrlField } from "@/components/Admin/DocumentUrlField";
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
import { staffOrderDetailHref } from "@/lib/staffOrderRoutes";

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

/** BE detail: `taxCodeOnInvoice` / `companyNameOnInvoice` + nested `customer`. */
function invoiceCustomerRecord(detail) {
  const c = pick(detail, "customer", "Customer");
  return c && typeof c === "object" ? /** @type {Record<string, unknown>} */ (c) : null;
}

function invoiceVatFieldsFromDetail(detail) {
  const customer = invoiceCustomerRecord(detail);
  const taxCode =
    pick(detail, "taxCodeOnInvoice", "TaxCodeOnInvoice") ??
    pick(detail, "taxCode", "TaxCode") ??
    (customer ? pick(customer, "taxCode", "TaxCode") : undefined);
  const companyName =
    pick(detail, "companyNameOnInvoice", "CompanyNameOnInvoice") ??
    pick(detail, "companyName", "CompanyName") ??
    (customer ? pick(customer, "companyName", "CompanyName") : undefined);
  const billingAddress =
    pick(detail, "billingAddress", "BillingAddress") ??
    (customer ? pick(customer, "companyAddress", "CompanyAddress") : undefined);
  return {
    taxCode: taxCode != null ? String(taxCode) : "",
    companyName: companyName != null ? String(companyName) : "",
    billingAddress: billingAddress != null ? String(billingAddress) : "",
  };
}

function editFormFromInvoiceDetail(rec) {
  const vat = invoiceVatFieldsFromDetail(rec);
  return {
    ...vat,
    dueDate: isoToDatetimeLocal(String(pick(rec, "dueDate", "DueDate") ?? "")),
    pdfUrl: String(pick(rec, "pdfUrl", "PdfUrl") ?? ""),
  };
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

function isoToDatetimeLocal(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function fromDatetimeLocalToIso(local) {
  const t = String(local || "").trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function AdminInvoiceDetailPage() {
  const { id: idParam } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();
  const isSalesShell = paths.shell === "saler";
  const id = String(idParam ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [statusOptions, setStatusOptions] = useState([]);

  const [editForm, setEditForm] = useState({
    taxCode: "",
    companyName: "",
    billingAddress: "",
    dueDate: "",
    pdfUrl: "",
  });
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const opts = await fetchAdminInvoiceStatuses(accessToken);
        if (!cancelled) setStatusOptions(opts.filter((o) => o.value));
      } catch {
        if (!cancelled) setStatusOptions([]);
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
      const d = await fetchAdminInvoiceDetail(accessToken, id);
      const rec = d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null;
      setDetail(rec);
      if (rec) {
        setEditForm(editFormFromInvoiceDetail(rec));
      }
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được hóa đơn.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const st = detail ? String(pick(detail, "status", "Status") ?? "") : "";
  const editable = isAdminInvoiceVatEditable(st) && !isSalesShell;
  const canCancel = canRequestAdminInvoiceCancel(st) && !isSalesShell;
  const invNum = detail ? pick(detail, "invoiceNumber", "InvoiceNumber") : null;
  const customerRec = detail ? invoiceCustomerRecord(detail) : null;
  const orderRec = detail ? pick(detail, "order", "Order") : null;
  const orderObj = orderRec && typeof orderRec === "object" ? /** @type {Record<string, unknown>} */ (orderRec) : null;

  const orderId =
    detail != null
      ? (pick(detail, "orderId", "OrderId") ?? (orderObj ? pick(orderObj, "id", "Id") : undefined))
      : null;
  const orderCode =
    detail != null
      ? (pick(detail, "orderCode", "OrderCode") ?? (orderObj ? pick(orderObj, "orderCode", "OrderCode") : undefined))
      : null;
  const orderHref = staffOrderDetailHref(paths, { orderId, orderCode });
  const contractId = detail ? pick(detail, "contractId", "ContractId") : null;
  const customerId =
    detail != null
      ? (pick(detail, "customerId", "CustomerId") ?? (customerRec ? pick(customerRec, "id", "Id") : undefined))
      : null;
  const customerName =
    detail != null
      ? (pick(detail, "customerName", "CustomerName") ??
          (customerRec ? pick(customerRec, "fullName", "FullName") : undefined))
      : null;
  const subTotal = detail ? pick(detail, "subTotal", "SubTotal") : null;
  const taxAmount = detail ? pick(detail, "taxAmount", "TaxAmount") : null;
  const totalAmount = detail ? pick(detail, "totalAmount", "TotalAmount") : null;
  const amountPaid =
    detail != null
      ? (pick(detail, "paidAmount", "PaidAmount") ?? pick(detail, "amountPaid", "AmountPaid"))
      : null;
  const balanceDue =
    detail != null
      ? (pick(detail, "remainingAmount", "RemainingAmount") ?? pick(detail, "balanceDue", "BalanceDue"))
      : null;
  const issueDate = detail ? pick(detail, "issueDate", "IssueDate") : null;
  const dueDateRaw = detail ? pick(detail, "dueDate", "DueDate") : null;
  const lines = detail ? pick(detail, "lines", "Lines") : null;
  const lineArr = Array.isArray(lines) ? lines : [];

  const paymentPrefillUrl = `${paths.paymentsList}?invoiceId=${encodeURIComponent(id)}`;

  const submitSave = async () => {
    if (!accessToken || !id || saveSubmitting || !editable) return;
    setSaveSubmitting(true);
    setSaveError("");
    try {
      const dueIso = fromDatetimeLocalToIso(editForm.dueDate);
      const payload = {
        taxCode: editForm.taxCode.trim() || undefined,
        companyName: editForm.companyName.trim() || undefined,
        billingAddress: editForm.billingAddress.trim() || undefined,
        pdfUrl: editForm.pdfUrl.trim() || undefined,
        ...(dueIso ? { dueDate: dueIso } : {}),
      };
      const updated = await updateAdminInvoice(accessToken, id, payload);
      setDetail(updated && typeof updated === "object" ? /** @type {Record<string, unknown>} */ (updated) : detail);
    } catch (e) {
      setSaveError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Lưu thất bại.");
    } finally {
      setSaveSubmitting(false);
    }
  };

  const submitCancel = async () => {
    if (!accessToken || !id || cancelSubmitting) return;
    setCancelSubmitting(true);
    setCancelError("");
    try {
      const updated = await cancelAdminInvoice(accessToken, id, cancelReason);
      setCancelOpen(false);
      setCancelReason("");
      const rec = updated && typeof updated === "object" ? /** @type {Record<string, unknown>} */ (updated) : detail;
      setDetail(rec);
      if (rec) setEditForm(editFormFromInvoiceDetail(rec));
    } catch (e) {
      setCancelError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Hủy thất bại.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to={paths.root} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={paths.invoicesList} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Hóa đơn
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="px-1.5 font-semibold text-slate-800 dark:text-slate-200">
          {invNum != null ? String(invNum) : id ? `#${id}` : "—"}
        </span>
      </nav>

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelError("");
        }}
      >
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => cancelSubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Hủy hóa đơn</DialogTitle>
            <DialogDescription>Nhập lý do hủy nếu cần.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="cx-r">
              Lý do
            </label>
            <textarea
              id="cx-r"
              rows={3}
              className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={cancelSubmitting}
            />
          </div>
          {cancelError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {cancelError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={cancelSubmitting} onClick={() => setCancelOpen(false)}>
              Đóng
            </Button>
            <Button type="button" variant="destructive" disabled={cancelSubmitting} onClick={() => void submitCancel()}>
              {cancelSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Xác nhận hủy
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
                {invNum != null ? String(invNum) : `Hóa đơn #${id}`}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    invoiceStatusBadgeClass(st)
                  )}
                >
                  {labelAdminInvoiceStatus(st, statusOptions)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isSalesShell ? (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <Link to={paymentPrefillUrl}>
                    <CreditCard className="h-4 w-4" aria-hidden />
                    Ghi nhận thanh toán
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </Link>
                </Button>
              ) : null}
              {canCancel ? (
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-red-700 dark:text-red-400" onClick={() => setCancelOpen(true)}>
                  <XCircle className="h-4 w-4" aria-hidden />
                  Hủy HĐ
                </Button>
              ) : null}
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Tổng quan</CardTitle>
                <CardDescription>Khách, đơn, số tiền</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Khách</span>
                  <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {customerName != null ? String(customerName) : "—"}
                    {customerId != null ? <span className="ml-2 font-mono text-xs text-slate-500">#{customerId}</span> : null}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Đơn hàng</span>
                  <span className="text-right">
                    {orderHref ? (
                      <Link className="font-mono text-violet-700 underline-offset-2 hover:underline dark:text-violet-400" to={orderHref}>
                        {orderCode != null ? String(orderCode) : orderId != null ? `#${orderId}` : "Xem đơn"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Hợp đồng</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{contractId != null ? String(contractId) : "—"}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Tạm tính</dt>
                      <dd className="font-mono font-semibold tabular-nums">{formatMoneyVnd(subTotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Thuế</dt>
                      <dd className="font-mono tabular-nums">{formatMoneyVnd(taxAmount)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-slate-700 dark:text-slate-300">Tổng</dt>
                      <dd className="font-mono font-semibold tabular-nums">
                        {totalAmount != null ? formatMoneyVnd(totalAmount) : formatMoneyVnd(Number(subTotal || 0) + Number(taxAmount || 0))}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Đã thanh toán</dt>
                      <dd className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoneyVnd(amountPaid)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Còn lại</dt>
                      <dd className="font-mono font-semibold tabular-nums text-amber-800 dark:text-amber-300">{formatMoneyVnd(balanceDue)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <span>Phát hành</span>
                  <span>{formatDateTime(issueDate != null ? String(issueDate) : "")}</span>
                </div>
                <div className="flex justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <span>Hạn thanh toán</span>
                  <span>{formatDateTime(dueDateRaw != null ? String(dueDateRaw) : "")}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Xuất VAT</CardTitle>
                <CardDescription>
                  {editable ? "Chỉnh sửa được khi hóa đơn ở trạng thái nháp hoặc chưa thanh toán." : "Trạng thái hiện tại không cho sửa thông tin xuất VAT."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="ed-tax">
                    MST
                  </label>
                  <input id="ed-tax" type="text" className={fieldInput} disabled={!editable || saveSubmitting} value={editForm.taxCode} onChange={(e) => setEditForm((f) => ({ ...f, taxCode: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="ed-comp">
                    Tên công ty
                  </label>
                  <input id="ed-comp" type="text" className={fieldInput} disabled={!editable || saveSubmitting} value={editForm.companyName} onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="ed-addr">
                    Địa chỉ
                  </label>
                  <input id="ed-addr" type="text" className={fieldInput} disabled={!editable || saveSubmitting} value={editForm.billingAddress} onChange={(e) => setEditForm((f) => ({ ...f, billingAddress: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="ed-due">
                    Hạn thanh toán
                  </label>
                  <input id="ed-due" type="datetime-local" className={fieldInput} disabled={!editable || saveSubmitting} value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <DocumentUrlField
                  id="ed-pdf"
                  label="File hóa đơn (PDF)"
                  value={editForm.pdfUrl}
                  onChange={(url) => setEditForm((f) => ({ ...f, pdfUrl: url }))}
                  uploadFolder="invoice"
                  disabled={!editable || saveSubmitting}
                  urlPlaceholder="https://…"
                />
                {saveError ? (
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <Button type="button" disabled={!editable || saveSubmitting} className="gap-1.5" onClick={() => void submitSave()}>
                  {saveSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </div>

          {lineArr.length > 0 ? (
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Dòng hàng</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                        <th className="px-4 py-2 pl-6">Mô tả</th>
                        <th className="px-4 py-2 text-right">SL</th>
                        <th className="px-4 py-2 pr-6 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lineArr.map((line, i) => {
                        const o = line && typeof line === "object" ? /** @type {Record<string, unknown>} */ (line) : {};
                        const desc = pick(o, "description", "Description") ?? pick(o, "productName", "ProductName");
                        const qty = pick(o, "quantity", "Quantity");
                        const lineTotal = pick(o, "lineTotal", "LineTotal") ?? pick(o, "amount", "Amount");
                        return (
                          <tr key={pick(o, "id", "Id") != null ? String(pick(o, "id", "Id")) : i}>
                            <td className="px-4 py-2 pl-6">{desc != null ? String(desc) : "—"}</td>
                            <td className="px-4 py-2 text-right font-mono tabular-nums">{qty != null ? String(qty) : "—"}</td>
                            <td className="px-4 py-2 pr-6 text-right font-mono tabular-nums">{formatMoneyVnd(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Link to={paths.invoicesList} className="inline-flex text-sm font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400">
            ← Danh sách hóa đơn
          </Link>
        </>
      ) : null}
    </div>
  );
}
