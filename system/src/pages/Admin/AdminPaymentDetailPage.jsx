import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchAdminPaymentDetail,
  fetchAdminPaymentTransactionTypes,
  labelAdminPaymentMethod,
  labelAdminPaymentTransactionType,
  paymentRowAccentClass,
} from "@/services/admin/adminPaymentsApi";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { staffOrderDetailHref } from "@/lib/staffOrderRoutes";

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/** @param {unknown} detail */
function pickPaymentLinks(detail) {
  if (!detail || typeof detail !== "object") {
    return { cid: null, cname: null, iid: null, invNum: null, oid: null, orderCode: null };
  }
  const row = /** @type {Record<string, unknown>} */ (detail);
  const customer = pick(row, "customer", "Customer");
  const invoice = pick(row, "invoice", "Invoice");
  const custObj = customer && typeof customer === "object" ? /** @type {Record<string, unknown>} */ (customer) : null;
  const invObj = invoice && typeof invoice === "object" ? /** @type {Record<string, unknown>} */ (invoice) : null;

  const cid = custObj ? pick(custObj, "id", "Id") : pick(row, "customerId", "CustomerId");
  const cname = custObj
    ? pick(custObj, "fullName", "FullName") ?? pick(custObj, "companyName", "CompanyName")
    : pick(row, "customerName", "CustomerName");
  const iid = invObj ? pick(invObj, "id", "Id") : pick(row, "invoiceId", "InvoiceId");
  const invNum = invObj ? pick(invObj, "invoiceNumber", "InvoiceNumber") : pick(row, "invoiceNumber", "InvoiceNumber");
  const orderNested = invObj ? pick(invObj, "order", "Order") : null;
  const orderObj =
    orderNested && typeof orderNested === "object" ? /** @type {Record<string, unknown>} */ (orderNested) : null;
  const oid =
    (invObj ? pick(invObj, "orderId", "OrderId") : pick(row, "orderId", "OrderId")) ??
    (orderObj ? pick(orderObj, "id", "Id") : null);
  const orderCode =
    (invObj ? pick(invObj, "orderCode", "OrderCode") : pick(row, "orderCode", "OrderCode")) ??
    (orderObj ? pick(orderObj, "orderCode", "OrderCode") : null);

  return { cid, cname, iid, invNum, oid, orderCode };
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const x = Number(n);
  const sign = x < 0 ? "-" : "";
  return `${sign}${Math.abs(x).toLocaleString("vi-VN")} đ`;
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
      second: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export function AdminPaymentDetailPage() {
  const { id: idParam } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();
  const id = String(idParam ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [typeOptions, setTypeOptions] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const opts = await fetchAdminPaymentTransactionTypes(accessToken);
        if (!cancelled) setTypeOptions(opts.filter((o) => o.value));
      } catch {
        if (!cancelled) setTypeOptions([]);
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
      const d = await fetchAdminPaymentDetail(accessToken, id);
      setDetail(d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết giao dịch.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const tx = detail ? pick(detail, "transactionType", "TransactionType") : null;
  const amt = detail ? pick(detail, "amount", "Amount") : null;
  const method = detail ? pick(detail, "paymentMethod", "PaymentMethod") : null;
  const payDate = detail ? pick(detail, "paymentDate", "PaymentDate") : null;
  const refc = detail ? pick(detail, "referenceCode", "ReferenceCode") : null;
  const note = detail ? pick(detail, "note", "Note") : null;
  const { cid, cname, iid, invNum, oid, orderCode } = pickPaymentLinks(detail);
  const orderHref = staffOrderDetailHref(paths, { orderId: oid, orderCode });
  const created = detail ? pick(detail, "createdAt", "CreatedAt") : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to={paths.root} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={paths.paymentsList} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Thanh toán
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
              <Link to={paths.paymentsList}>Về danh sách</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Giao dịch #{id}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {labelAdminPaymentTransactionType(tx != null ? String(tx) : "", typeOptions)}
              </span>
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  paymentRowAccentClass(tx != null ? String(tx) : "", amt != null ? Number(amt) : undefined)
                )}
              >
                {formatMoneyVnd(amt)}
              </span>
            </div>
          </header>

          <div className="grid gap-6">
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Chứng từ</CardTitle>
                <CardDescription>Thời điểm, phương thức, tham chiếu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Thời điểm thanh toán</span>
                  <span className="text-right font-medium">{formatDateTime(payDate != null ? String(payDate) : "")}</span>
                </div>
                {created ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Ghi nhận hệ thống</span>
                    <span className="text-right text-xs text-slate-600 dark:text-slate-400">{formatDateTime(String(created))}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Phương thức</span>
                  <span className="font-medium">{labelAdminPaymentMethod(method != null ? String(method) : "")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Mã tham chiếu</span>
                  <span className="max-w-[60%] break-all text-right font-mono text-xs">{refc != null ? String(refc) : "—"}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-slate-500">Ghi chú</span>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{note != null ? String(note) : "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Liên kết</CardTitle>
                <CardDescription>Khách, hóa đơn, đơn hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Khách</span>
                  <span className="text-right">
                    {cid != null ? (
                      <Link
                        className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                        to={`${paths.customersList}/${encodeURIComponent(String(cid))}`}
                      >
                        {cname != null ? String(cname) : `Khách #${cid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {cid != null ? <span className="ml-2 font-mono text-xs text-slate-500">#{cid}</span> : null}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Hóa đơn</span>
                  <span className="text-right">
                    {iid != null ? (
                      <Link
                        className="font-mono text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                        to={`${paths.invoicesList}/${encodeURIComponent(String(iid))}`}
                      >
                        {invNum != null ? String(invNum) : `#${iid}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Đơn hàng</span>
                  <span className="text-right">
                    {orderHref ? (
                      <Link
                        className="font-mono text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                        to={orderHref}
                      >
                        {orderCode != null ? String(orderCode) : oid != null ? `#${oid}` : "Xem đơn"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
