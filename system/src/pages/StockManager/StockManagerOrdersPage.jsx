import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  ADMIN_PAYMENT_STATUS_OPTIONS,
  fetchAdminOrders,
  labelOrderStatus,
  labelPaymentStatus,
} from "@/services/admin/adminOrdersApi";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldSelect = cn(
  fieldInput,
  "cursor-pointer appearance-none bg-transparent pr-10"
);

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

function paymentPillClass(status) {
  if (status === "Paid") {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/60";
  }
  if (status === "Unpaid" || status === "UnPaid") {
    return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/60";
  }
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700";
}

function orderStatusPillClass() {
  return "bg-slate-100/90 text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-700";
}

/**
 * ID đơn trong danh sách (API có thể trả camelCase hoặc PascalCase).
 * @param {import("@/services/admin/adminOrdersApi").AdminOrderListItem | Record<string, unknown>} row
 * @returns {number | null}
 */
function adminOrderListRowId(row) {
  const r = /** @type {Record<string, unknown>} */ (row);
  const v = r.id ?? r.Id ?? r.orderId ?? r.OrderId;
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function StockManagerOrdersPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, paymentStatus, orderStatus, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminOrders(accessToken, {
        page,
        pageSize,
        search: debouncedSearch,
        paymentStatus,
        orderStatus,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách đơn.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    isAuthenticated,
    page,
    pageSize,
    debouncedSearch,
    paymentStatus,
    orderStatus,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPaymentStatus("");
    setOrderStatus("");
  };

  const hasActiveFilters =
    Boolean(searchInput.trim()) || Boolean(paymentStatus) || Boolean(orderStatus);

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <Card className="overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:shadow-none">
        <CardHeader className="space-y-1 border-b border-slate-100 bg-gradient-to-br from-slate-50/90 to-white pb-4 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Filter className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Bộ lọc đơn hàng</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 sm:col-span-2 lg:col-span-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="admin-order-search">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-order-search"
                  type="search"
                  placeholder="Mã đơn, tên khách, số điện thoại…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={cn(fieldInput, "pl-10")}
                />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="admin-pay-status">
                Thanh toán
              </label>
              <div className="relative">
                <select id="admin-pay-status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={fieldSelect}>
                  {ADMIN_PAYMENT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="admin-order-status">
                Trạng thái đơn
              </label>
              <div className="relative">
                <select id="admin-order-status" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={fieldSelect}>
                  {ADMIN_ORDER_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all-order"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" className="gap-1.5 shadow-sm" onClick={() => load()} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Làm mới
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                Xóa bộ lọc
              </Button>
            </div>
            {/* <p className="max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Tìm kiếm áp dụng sau ~0,5s khi ngừng gõ. Tham số API:{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                page, pageSize, search, paymentStatus, orderStatus
              </code>
            </p> */}
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

      {/* Bảng */}
      <Card className="overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              {loading ? "Danh sách đơn hàng" : `Danh sách đơn hàng · ${totalCount.toLocaleString("vi-VN")} đơn`}
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
              <span className="tabular-nums text-foreground">
                {page} / {totalPages}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-5 py-3.5 first:pl-6">Mã đơn</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Khách hàng</th>
                  <th className="px-5 py-3.5">Loại</th>
                  <th className="px-5 py-3.5">Trạng thái đơn</th>
                  <th className="px-5 py-3.5">Thanh toán</th>
                  <th className="px-5 py-3.5 text-right">Dòng</th>
                  <th className="px-5 py-3.5 text-right last:pr-6">Tổng thanh toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                        <span className="text-sm font-medium">Đang tải dữ liệu…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có đơn hàng phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const orderId = adminOrderListRowId(row);
                  const detailPath = orderId != null ? `/stock-manager/orders/${orderId}` : null;
                  return (
                  <tr
                    key={orderId ?? row.orderCode ?? idx}
                    role={detailPath ? "button" : undefined}
                    tabIndex={detailPath ? 0 : undefined}
                    className={cn(
                      detailPath && "cursor-pointer transition-colors hover:bg-primary/[0.03] dark:hover:bg-primary/5",
                      !detailPath && "cursor-default",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                    onClick={() => {
                      if (detailPath) navigate(detailPath);
                    }}
                    onKeyDown={(e) => {
                      if (!detailPath) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(detailPath);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 pl-6 align-middle">
                      {detailPath ? (
                        <Link
                          to={detailPath}
                          className="inline-flex rounded-md bg-primary/8 px-2.5 py-1 font-mono text-xs font-semibold text-primary ring-1 ring-primary/15 transition-colors hover:bg-primary/15 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:bg-primary/15 dark:hover:bg-primary/25"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.orderCode}
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-md bg-primary/8 px-2.5 py-1 font-mono text-xs font-semibold text-primary ring-1 ring-primary/15 dark:bg-primary/15">
                          {row.orderCode}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="max-w-[200px] px-5 py-3.5 align-middle">
                      <div className="truncate font-medium text-slate-900 dark:text-slate-100">{row.customerName}</div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">{row.customerPhone}</div>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                          row.customerType === "B2B"
                            ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-800/50"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
                        )}
                      >
                        {row.customerType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex max-w-[10rem] truncate rounded-full px-2.5 py-0.5 text-xs font-medium",
                          orderStatusPillClass()
                        )}
                        title={labelOrderStatus(row.orderStatus)}
                      >
                        {labelOrderStatus(row.orderStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          paymentPillClass(row.paymentStatus)
                        )}
                      >
                        {labelPaymentStatus(row.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right align-middle tabular-nums text-slate-700 dark:text-slate-300">
                      {row.lineCount}
                    </td>
                    <td className="px-5 py-3.5 pr-6 text-right align-middle">
                      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatMoneyVnd(row.payableTotal)}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalCount > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
                  </span>{" "}
                  trong tổng{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{totalCount.toLocaleString("vi-VN")}</span>{" "}
                  đơn
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
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="min-w-[5rem] text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
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
