import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  labelOrderStatus,
  labelPaymentStatus,
} from "@/services/admin/adminOrdersApi";
import { canCreateFulfillment, getB2bPaymentWarning, getNextOrderStatuses } from "@/lib/orderFulfillmentRules";
import { staffFulfillmentDetailHref } from "@/lib/staffFulfillmentRoutes";
import { fetchAdminOrderDetailResolved } from "@/lib/staffOrderRoutes";
import {
  createAdminOrderFulfillment,
  DEFAULT_FULFILLMENT_TICKET_TYPE,
  fetchAdminFulfillments,
  FULFILLMENT_TICKET_TYPE_OPTIONS,
  labelFulfillmentStatus,
  labelFulfillmentTicketType,
} from "@/services/admin/adminFulfillmentsApi";
import { ChevronRight, ExternalLink, Loader2, MapPin, Package, Plus, Receipt, RotateCcw, ShieldCheck, Truck, UserRound } from "lucide-react";
import { getOrderStatusBadgeClass, getPaymentStatusBadgeClass } from "@/config/orderStatusTheme";
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
import { OrderStatusUpdateDialog } from "@/components/Admin/orders/OrderStatusUpdateDialog";

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fulfillmentStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  if (s === "picking") {
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
  }
  if (s === "packed") {
    return "bg-violet-50 text-violet-950 ring-1 ring-violet-200/90 dark:bg-violet-950/35 dark:text-violet-100 dark:ring-violet-800/50";
  }
  if (s === "shipped") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-pulse" aria-hidden>
      <div className="h-4 w-2/3 max-w-md rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-12 w-full max-w-xl rounded-xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
          <div className="h-32 rounded-2xl bg-slate-200/60 dark:bg-slate-800/70" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
          <div className="h-36 rounded-2xl bg-slate-200/60 dark:bg-slate-800/70" />
        </div>
      </div>
    </div>
  );
}

/**
 * Trang chi tiết đơn (admin) — GET /api/admin/orders/:id
 */
export function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, user } = useAuth();
  const paths = useStaffShellPaths();
  const isSalesShell = paths.shell === "saler";
  const canAccessWarehouse = user?.canAccessWarehouse === true && !isSalesShell;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fulfillments, setFulfillments] = useState([]);
  const [fulfillmentsLoading, setFulfillmentsLoading] = useState(false);
  const [fulfillmentsError, setFulfillmentsError] = useState("");
  const [createFulfillmentOpen, setCreateFulfillmentOpen] = useState(false);
  const [createTicketType, setCreateTicketType] = useState(DEFAULT_FULFILLMENT_TICKET_TYPE);
  const [createNotes, setCreateNotes] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [orderStatusUpdateOpen, setOrderStatusUpdateOpen] = useState(false);

  const orderStatusTransitions = useMemo(() => {
    if (!order) return [];
    return getNextOrderStatuses(order.orderStatus, {
      allowedFromApi: order.workflow?.allowedOrderTransitions,
      shell: paths.shell,
    });
  }, [order, paths.shell]);

  const canClickOrderStatus = orderStatusTransitions.length > 0;

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOrderDetailResolved(accessToken, id);
      setOrder(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết đơn.";
      setError(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadFulfillmentsForOrder = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !order?.id) {
      setFulfillments([]);
      return;
    }
    setFulfillmentsLoading(true);
    setFulfillmentsError("");
    try {
      const res = await fetchAdminFulfillments(accessToken, {
        page: 1,
        pageSize: 50,
        orderId: order.id,
      });
      setFulfillments(res.items ?? []);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được phiếu công việc.";
      setFulfillmentsError(msg);
      setFulfillments([]);
    } finally {
      setFulfillmentsLoading(false);
    }
  }, [accessToken, isAuthenticated, order?.id]);

  useEffect(() => {
    if (order?.id) {
      loadFulfillmentsForOrder();
    } else {
      setFulfillments([]);
      setFulfillmentsError("");
    }
  }, [order?.id, loadFulfillmentsForOrder]);

  const submitCreateFulfillment = async () => {
    if (!accessToken || !order?.id || createSubmitting) return;
    const tt = createTicketType.trim().slice(0, 100);
    const n = createNotes.trim();
    if (n.length > 1000) {
      setCreateError("Ghi chú tối đa 1000 ký tự.");
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      const data = await createAdminOrderFulfillment(accessToken, order.id, {
        ticketType: tt || undefined,
        notes: n || undefined,
      });
      const raw = data && typeof data === "object" ? /** @type {Record<string, unknown>} */ (data) : {};
      const newId = raw.id ?? raw.Id;
      setCreateFulfillmentOpen(false);
      setCreateTicketType(DEFAULT_FULFILLMENT_TICKET_TYPE);
      setCreateNotes("");
      await Promise.all([load(), loadFulfillmentsForOrder()]);
      const href = staffFulfillmentDetailHref(paths, newId);
      if (href) navigate(href);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tạo được phiếu công việc.";
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="mx-auto max-w-7xl text-sm text-muted-foreground">
        Thiếu tham số đường dẫn đơn hàng.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link
          to={paths.root}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="px-1.5 py-0.5 text-slate-400 dark:text-slate-500">Bán hàng</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={paths.ordersList}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Đơn hàng
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="max-w-[min(100%,12rem)] truncate px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
          {order?.orderCode ?? `#${id}`}
        </span>
      </nav>

      {loading && !order ? <DetailSkeleton /> : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && order ? (
        <>
          <Dialog
            open={createFulfillmentOpen}
            onOpenChange={(open) => {
              setCreateFulfillmentOpen(open);
              if (!open) {
                setCreateError("");
                setCreateTicketType(DEFAULT_FULFILLMENT_TICKET_TYPE);
                setCreateNotes("");
              }
            }}
          >
            <DialogContent
              className="sm:max-w-md"
              onPointerDownOutside={(e) => createSubmitting && e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>Tạo phiếu xuất kho</DialogTitle>
                <DialogDescription>
                  Tạo phiếu xuất cho đơn <span className="font-semibold">{order.orderCode ?? `#${order.id}`}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-1">
                {getB2bPaymentWarning(order, order.workflow) ? (
                  <div
                    className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
                    role="status"
                  >
                    {getB2bPaymentWarning(order, order.workflow)}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400" htmlFor="ff-create-type">
                    Hình thức giao
                  </label>
                  <select
                    id="ff-create-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={createTicketType}
                    onChange={(e) => setCreateTicketType(e.target.value)}
                    disabled={createSubmitting}
                  >
                    {FULFILLMENT_TICKET_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400" htmlFor="ff-create-notes">
                    Ghi chú
                  </label>
                  <textarea
                    id="ff-create-notes"
                    rows={3}
                    maxLength={1000}
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="VD. Gói hàng cẩn thận…"
                    value={createNotes}
                    onChange={(e) => setCreateNotes(e.target.value)}
                    disabled={createSubmitting}
                  />
                </div>
                {createError ? (
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {createError}
                  </p>
                ) : null}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" disabled={createSubmitting} onClick={() => setCreateFulfillmentOpen(false)}>
                  Hủy
                </Button>
                <Button type="button" disabled={createSubmitting} className="gap-1.5" onClick={() => void submitCreateFulfillment()}>
                  {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                  Tạo phiếu
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <OrderStatusUpdateDialog
            open={orderStatusUpdateOpen}
            onOpenChange={setOrderStatusUpdateOpen}
            order={
              order
                ? {
                    id: order.id,
                    orderCode: order.orderCode,
                    orderStatus: order.orderStatus,
                    workflow: order.workflow,
                  }
                : null
            }
            shell={paths.shell}
            accessToken={accessToken}
            onUpdated={() => void load()}
          />

          <header className="border-b border-slate-200/90 pb-8 dark:border-slate-800">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Chi tiết đơn
                </p>
                <h2 className="font-mono text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                  {order.orderCode}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tạo lúc{" "}
                  <time dateTime={order.createdAt} className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDateTime(order.createdAt)}
                  </time>
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                {canClickOrderStatus ? (
                  <button
                    type="button"
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                      "cursor-pointer border-0 transition-opacity hover:opacity-90",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                      getOrderStatusBadgeClass(order.orderStatus)
                    )}
                    title={isSalesShell ? "Xác nhận khách đã nhận hàng" : "Cập nhật trạng thái đơn"}
                    aria-label={`Trạng thái đơn ${labelOrderStatus(order.orderStatus)}, nhấn để sửa`}
                    onClick={() => setOrderStatusUpdateOpen(true)}
                  >
                    {labelOrderStatus(order.orderStatus)}
                  </button>
                ) : (
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                      getOrderStatusBadgeClass(order.orderStatus)
                    )}
                  >
                    {labelOrderStatus(order.orderStatus)}
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    getPaymentStatusBadgeClass(order.paymentStatus)
                  )}
                >
                  {labelPaymentStatus(order.paymentStatus)}
                </span>
              </div>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            <div className="min-w-0 space-y-8 lg:col-span-2">
              <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
                <CardHeader className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <Package className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold tracking-tight">Sản phẩm</CardTitle>
                      <CardDescription className="text-xs">
                        {order.lines?.length ?? 0} dòng trong đơn
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <th className="px-5 py-3 pl-6">Sản phẩm</th>
                          <th className="px-5 py-3 text-right tabular-nums">Đơn giá</th>
                          <th className="px-5 py-3 text-right tabular-nums">SL</th>
                          <th className="px-5 py-3 pr-6 text-right tabular-nums">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(order.lines ?? []).map((line) => (
                          <tr key={line.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/30">
                            <td className="px-5 py-4 pl-6 align-middle">
                              <div className="flex gap-3">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                  {line.imageUrl ? (
                                    <img
                                      src={line.imageUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                      <Package className="h-6 w-6 opacity-50" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 dark:text-slate-100">{line.productName}</p>
                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{line.variantName}</p>
                                  <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-500">
                                    {line.currentSku || line.skuSnapshot}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right align-middle font-mono text-sm tabular-nums text-slate-700 dark:text-slate-300">
                              {formatMoneyVnd(line.priceSnapshot)}
                            </td>
                            <td className="px-5 py-4 text-right align-middle font-mono text-sm tabular-nums text-slate-800 dark:text-slate-200">
                              {line.quantity}
                            </td>
                            <td className="px-5 py-4 pr-6 text-right align-middle font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {formatMoneyVnd(line.subTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(order.lines ?? []).length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-slate-500">Không có dòng sản phẩm.</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800 dark:shadow-none">
                <CardHeader className="border-b border-slate-100 bg-teal-50/50 dark:border-slate-800 dark:bg-teal-950/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300">
                        <Truck className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </span>
                      <div>
                        <CardTitle className="text-base font-semibold tracking-tight">Phiếu công việc</CardTitle>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {canAccessWarehouse && canCreateFulfillment(order, fulfillments, order.workflow) ? (
                        <Button type="button" size="sm" className="gap-1 shadow-sm" onClick={() => setCreateFulfillmentOpen(true)}>
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                          Tạo phiếu
                        </Button>
                      ) : null}
                      {paths.fulfillmentsList ? (
                        <Link
                          to={paths.fulfillmentsList}
                          className="inline-flex items-center text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                        >
                          Danh sách phiếu
                        </Link>
                      ) : null}
                      <Link
                        to={`${paths.invoicesList}?orderId=${encodeURIComponent(String(order.id))}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                      >
                        <Receipt className="h-3.5 w-3.5" aria-hidden />
                        Hóa đơn theo đơn
                      </Link>
                      <Link
                        to={`${paths.warrantyTicketsList}?orderId=${encodeURIComponent(String(order.id))}${
                          order.customer?.id != null && Number.isFinite(Number(order.customer.id))
                            ? `&customerId=${encodeURIComponent(String(order.customer.id))}`
                            : ""
                        }`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                        Phiếu bảo hành
                      </Link>
                      <Link
                        to={`${paths.returnsList}?orderId=${encodeURIComponent(String(order.id))}${
                          order.customer?.id != null && Number.isFinite(Number(order.customer.id))
                            ? `&customerId=${encodeURIComponent(String(order.customer.id))}`
                            : ""
                        }`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-800 underline-offset-2 hover:underline dark:text-orange-300"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                        Đổi / trả
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {fulfillmentsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin text-teal-600/70" />
                      Đang tải phiếu công việc…
                    </div>
                  ) : null}
                  {!fulfillmentsLoading && fulfillmentsError ? (
                    <p className="px-5 py-4 text-sm text-amber-800 dark:text-amber-300" role="alert">
                      {fulfillmentsError}
                    </p>
                  ) : null}
                  {!fulfillmentsLoading && !fulfillmentsError && fulfillments.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      Chưa có phiếu công việc cho đơn này.
                    </p>
                  ) : null}
                  {!fulfillmentsLoading && !fulfillmentsError && fulfillments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                            <th className="px-5 py-3 pl-6 font-mono">ID</th>
                            <th className="px-5 py-3">Hình thức</th>
                            <th className="px-5 py-3">Trạng thái</th>
                            <th className="px-5 py-3">NV phụ trách</th>
                            <th className="px-5 py-3 pr-6">Cập nhật</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {fulfillments.map((row, idx) => (
                            <tr
                              key={row.id}
                              className={cn(
                                "transition-colors hover:bg-teal-500/[0.04] dark:hover:bg-teal-500/[0.06]",
                                idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/20"
                              )}
                            >
                              <td className="whitespace-nowrap px-5 py-3 pl-6 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                {staffFulfillmentDetailHref(paths, row.id) ? (
                                  <Link
                                    to={staffFulfillmentDetailHref(paths, row.id)}
                                    className="font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                                  >
                                    {row.id}
                                  </Link>
                                ) : (
                                  <span className="font-semibold tabular-nums">{row.id}</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-slate-800 dark:text-slate-200">{labelFulfillmentTicketType(row.ticketType)}</td>
                              <td className="whitespace-nowrap px-5 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    fulfillmentStatusBadgeClass(row.status)
                                  )}
                                >
                                  {labelFulfillmentStatus(row.status)}
                                </span>
                              </td>
                              <td className="max-w-[160px] px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                                <span className="line-clamp-2">{row.assignedWorkerName || "—"}</span>
                              </td>
                              <td className="whitespace-nowrap px-5 py-3 pr-6 text-xs text-slate-600 dark:text-slate-400">
                                {formatDateTime(row.updatedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {!isSalesShell && order.payOsCheckoutUrl ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Liên kết thanh toán PayOS
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Hết hạn: {formatDateTime(order.payOsLinkExpiresAt)}
                  </p>
                  <a
                    href={order.payOsCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-emerald-700"
                  >
                    Mở cổng thanh toán
                    <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  </a>
                  {order.payOsPaymentLinkId ? (
                    <p className="mt-3 font-mono text-[11px] text-slate-500 dark:text-slate-500">
                      Link ID: {order.payOsPaymentLinkId}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <aside className="min-w-0 space-y-6 lg:pt-0">
              <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-500" strokeWidth={2} />
                    <CardTitle className="text-sm font-semibold">Khách hàng</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{order.customer?.fullName ?? "—"}</p>
                  <p className="text-slate-600 dark:text-slate-400">{order.customer?.phone ?? "—"}</p>
                  <p className="truncate text-slate-600 dark:text-slate-400">{order.customer?.email ?? "—"}</p>
                  <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {order.customer?.customerType ?? "—"}
                  </p>
                  {order.customer?.companyName ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300">{order.customer.companyName}</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" strokeWidth={2} />
                    <CardTitle className="text-sm font-semibold">Giao hàng</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {order.shippingAddress ? (
                    <>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {order.shippingAddress.receiverName}
                      </p>
                      <p>{order.shippingAddress.receiverPhone}</p>
                      <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                        {order.shippingAddress.addressLine}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500">Chưa có địa chỉ giao.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Tổng tiền</CardTitle>
                  <CardDescription className="text-xs">Phương thức: {order.paymentMethod ?? "—"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 font-mono text-sm tabular-nums">
                  <div className="flex justify-between gap-4 text-slate-600 dark:text-slate-400">
                    <span>Hàng hóa</span>
                    <span>{formatMoneyVnd(order.merchandiseTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-600 dark:text-slate-400">
                    <span>Giảm giá</span>
                    <span>{formatMoneyVnd(order.discountTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-50">
                    <span className="font-sans text-sm font-semibold">Thanh toán</span>
                    <span>{formatMoneyVnd(order.payableTotal)}</span>
                  </div>
                </CardContent>
              </Card>

              {order.quoteId != null || order.contractId != null ? (
                <div className="rounded-2xl border border-dashed border-slate-200/90 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {order.quoteId != null ? (
                    <p>
                      Báo giá: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{order.quoteId}</span>
                    </p>
                  ) : null}
                  {order.contractId != null ? (
                    <p className={order.quoteId != null ? "mt-1" : ""}>
                      Hợp đồng:{" "}
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{order.contractId}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
