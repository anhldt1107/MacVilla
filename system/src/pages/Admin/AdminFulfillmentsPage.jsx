import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { AdminOrderCodeFilterPicker } from "@/components/Admin/fulfillments/AdminOrderCodeFilterPicker";
import { AdminWorkerFilterPicker } from "@/components/Admin/fulfillments/AdminWorkerFilterPicker";
import { FulfillmentAssignWorkerDialog } from "@/components/Admin/fulfillments/FulfillmentAssignWorkerDialog";
import { FulfillmentStatusUpdateDialog } from "@/components/Admin/fulfillments/FulfillmentStatusUpdateDialog";
import {
  FULFILLMENT_STATUS_OPTIONS,
  assignAdminFulfillmentWorker,
  fetchAdminFulfillments,
  fulfillmentDetailToListItem,
  isFulfillmentWorkerUnassigned,
  labelFulfillmentStatus,
  labelFulfillmentTicketType,
} from "@/services/admin/adminFulfillmentsApi";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Loader2, Package, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const fieldSelect = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "cursor-pointer appearance-none bg-transparent pr-10",
  "hover:border-slate-300 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

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

/** Màu badge theo bước luồng xử lý. */
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

export function AdminFulfillmentsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [workerIdFilter, setWorkerIdFilter] = useState("");
  const [assignSelfForId, setAssignSelfForId] = useState(/** @type {number | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusFulfillment, setStatusFulfillment] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignFulfillment, setAssignFulfillment] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [status, pageSize, orderIdFilter, workerIdFilter]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const oidNum = Number(orderIdFilter.trim());
      const widNum = Number(workerIdFilter.trim());

      const result = await fetchAdminFulfillments(accessToken, {
        page,
        pageSize,
        status: status || undefined,
        orderId: Number.isFinite(oidNum) && oidNum > 0 ? oidNum : undefined,
        assignedWorkerId: Number.isFinite(widNum) && widNum > 0 ? widNum : undefined,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách phiếu công việc.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, status, orderIdFilter, workerIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setStatus("");
    setOrderIdFilter("");
    setWorkerIdFilter("");
  };
  const hasActiveFilters = Boolean(status || orderIdFilter.trim() || workerIdFilter.trim());

  const handleAssignSelf = async (row) => {
    if (!accessToken || !user?.id || assignSelfForId != null) return;
    const wid = Number(user.id);
    if (!Number.isFinite(wid) || wid < 1) return;
    setAssignSelfForId(row.id);
    try {
      const data = await assignAdminFulfillmentWorker(accessToken, row.id, { workerId: wid });
      patchFulfillmentFromApiResponse(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không gán phiếu cho tài khoản hiện tại.";
      setError(msg);
    } finally {
      setAssignSelfForId(null);
    }
  };

  const openFulfillmentStatusDialog = (row) => {
    setStatusFulfillment({
      id: row.id,
      orderCode: row.orderCode,
      status: row.status,
    });
    setStatusDialogOpen(true);
  };

  const patchFulfillmentFromApiResponse = (payload) => {
    if (!payload || typeof payload !== "object") return;
    const p = /** @type {Record<string, unknown>} */ (payload);
    const fid = Number(p.id ?? p.Id);
    if (!Number.isFinite(fid) || fid < 1) return;
    setData((prev) => {
      if (!prev) return prev;
      const fallback = prev.items.find((it) => it.id === fid);
      const nextItem = fulfillmentDetailToListItem(
        /** @type {import("@/services/admin/adminFulfillmentsApi").AdminFulfillmentStatusUpdateData} */ (payload),
        fallback ?? null
      );
      return {
        ...prev,
        items: prev.items.map((it) => (it.id === nextItem.id ? nextItem : it)),
      };
    });
  };

  const openAssignWorkerDialog = (row) => {
    setAssignFulfillment({ id: row.id, orderCode: row.orderCode });
    setAssignDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <FulfillmentStatusUpdateDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        fulfillment={statusFulfillment}
        accessToken={accessToken}
        onUpdated={patchFulfillmentFromApiResponse}
      />
      <FulfillmentAssignWorkerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        fulfillment={assignFulfillment}
        accessToken={accessToken}
        onAssigned={patchFulfillmentFromApiResponse}
      />
      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-fulfillment-status"
              >
                Trạng thái phiếu
              </label>
              <div className="relative">
                <select
                  id="admin-fulfillment-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {FULFILLMENT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="lg:col-span-3">
              <AdminOrderCodeFilterPicker
                accessToken={accessToken}
                value={orderIdFilter}
                onChange={setOrderIdFilter}
                idPrefix="admin-fulfillment-order"
                label="Mã đơn"
              />
            </div>
            <div className="lg:col-span-3">
              <AdminWorkerFilterPicker
                accessToken={accessToken}
                value={workerIdFilter}
                onChange={setWorkerIdFilter}
                idPrefix="admin-fulfillment-worker"
                label="Nhân viên phụ trách"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end">
              <Button
                type="button"
                size="sm"
                className="gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => load()}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Làm mới
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              {loading ? "Danh sách phiếu công việc" : `Danh sách phiếu công việc · ${totalCount.toLocaleString("vi-VN")} phiếu`}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900/50">
              <span className="font-medium text-slate-600 dark:text-slate-300">Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-7 cursor-pointer rounded-md border-0 bg-transparent pr-6 text-sm font-semibold text-foreground focus:ring-0"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} / trang
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              Trang{" "}
              <span className="font-mono tabular-nums text-foreground">
                {page} / {totalPages}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3.5 pl-6 font-mono">ID</th>
                  <th className="px-4 py-3.5">Mã đơn</th>
                  <th className="px-4 py-3.5">Hình thức</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Khách hàng</th>
                  <th className="px-4 py-3.5">NV phụ trách</th>
                  <th className="px-4 py-3.5">Người tạo</th>
                  <th className="px-4 py-3.5">Thời gian</th>
                  <th className="px-4 py-3.5 pr-6 text-right">Đơn hàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-600/70" />
                        <span className="text-sm font-medium">Đang tải dữ liệu…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có phiếu công việc phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc trạng thái hoặc làm mới.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    role="link"
                    tabIndex={0}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-teal-500/[0.04] dark:hover:bg-teal-500/[0.06]",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                    onClick={() => navigate(`/admin/logistics/fulfillments/${row.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/admin/logistics/fulfillments/${row.id}`);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {row.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                      <span className="font-mono text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        {row.orderCode}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-500">Đơn #{row.orderId}</span>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-sm text-slate-800 dark:text-slate-200">
                      {labelFulfillmentTicketType(row.ticketType)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                      <button
                        type="button"
                        className={cn(
                          "inline-flex cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold transition",
                          "hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                          fulfillmentStatusBadgeClass(row.status)
                        )}
                        title="Cập nhật trạng thái phiếu công việc"
                        aria-label={`Cập nhật trạng thái phiếu công việc ${row.id}, hiện ${labelFulfillmentStatus(row.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openFulfillmentStatusDialog(row);
                        }}
                      >
                        {labelFulfillmentStatus(row.status)}
                      </button>
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5 align-middle">
                      <div className="truncate font-medium text-slate-900 dark:text-slate-100">{row.customerName || "—"}</div>
                      {row.customerPhone ? (
                        <div className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">{row.customerPhone}</div>
                      ) : null}
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5 align-middle text-sm text-slate-700 dark:text-slate-300">
                      {isFulfillmentWorkerUnassigned(row) ? (
                        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="w-full rounded-md border border-dashed border-teal-300/80 bg-teal-50/50 px-2.5 py-2 text-left text-xs font-medium text-teal-800 transition hover:bg-teal-100/80 hover:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-teal-700/60 dark:bg-teal-950/25 dark:text-teal-200 dark:hover:bg-teal-950/40"
                            onClick={() => openAssignWorkerDialog(row)}
                          >
                            Chưa gán — chọn Worker
                          </button>
                          {user?.id ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 w-full gap-1 text-xs"
                              disabled={assignSelfForId === row.id}
                              onClick={() => void handleAssignSelf(row)}
                            >
                              {assignSelfForId === row.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                <User className="h-3.5 w-3.5" aria-hidden />
                              )}
                              Gán tôi
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="line-clamp-2">{row.assignedWorkerName}</span>
                      )}
                    </td>
                    <td className="max-w-[160px] px-4 py-3.5 align-middle text-sm text-slate-700 dark:text-slate-300">
                      <span className="line-clamp-2">{row.createdByName || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      <div className="font-medium text-slate-700 dark:text-slate-300">{formatDateTime(row.updatedAt)}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">Tạo: {formatDateTime(row.createdAt)}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 pr-6 text-right align-middle">
                      <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5" asChild>
                        <Link to={`/admin/sales/orders/${row.orderId}`} onClick={(e) => e.stopPropagation()}>
                          Xem đơn
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalCount > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-medium font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
                  </span>{" "}
                  trong tổng{" "}
                  <span className="font-medium font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {totalCount.toLocaleString("vi-VN")}
                  </span>{" "}
                  phiếu công việc
                </>
              ) : (
                "Không có bản ghi để phân trang."
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm transition-transform active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="min-w-[5rem] text-center font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm transition-transform active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
