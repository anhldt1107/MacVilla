import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { filterOrdersEligibleForFulfillment } from "@/lib/warehouseQueueUtils";
import { fetchAdminOrders, labelOrderStatus } from "@/services/admin/adminOrdersApi";
import { fetchAdminFulfillments } from "@/services/admin/adminFulfillmentsApi";
import { ChevronRight, Loader2, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ORDERS_BASE = "/stock-manager/orders";

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

/**
 * Hàng đợi tạo phiếu — đơn `Confirmed` ( A).
 */
export function StockManagerFulfillmentsCreatePage() {
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [ordersResult, fulfillmentsResult] = await Promise.all([
        fetchAdminOrders(accessToken, {
          page,
          pageSize,
          orderStatus: "Confirmed",
        }),
        fetchAdminFulfillments(accessToken, { page: 1, pageSize: 200 }),
      ]);

      const eligible = filterOrdersEligibleForFulfillment(
        ordersResult.items,
        fulfillmentsResult.items
      );

      setData({
        ...ordersResult,
        items: eligible,
        totalCount: eligible.length,
      });
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được đơn.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);

  return (
    <div className="space-y-6 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/stock-manager" className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard kho
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="font-semibold text-slate-800 dark:text-slate-200">Tạo phiếu xuất</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Tạo phiếu xuất kho</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Đơn đã xác nhận — mở chi tiết đơn và bấm <strong>Tạo phiếu</strong>.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
          Tải lại
        </Button>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-800 ring-1 ring-teal-500/20 dark:text-teal-300">
              <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg">Đơn Confirmed</CardTitle>
              <CardDescription className="mt-1">
                {loading ? "Đang tải…" : `${totalCount.toLocaleString("vi-VN")} đơn — trang ${page} / ${totalPages}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                  <th className="px-4 py-3 pl-6">Mã đơn</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Tổng</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600/70" aria-hidden />
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-600 dark:text-slate-400">
                      Không có đơn Confirmed.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const oid = row.id ?? row.Id;
                  const idNum = oid != null && Number.isFinite(Number(oid)) ? Number(oid) : null;
                  return (
                    <tr
                      key={idNum ?? idx}
                      className={cn(idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/20")}
                    >
                      <td className="px-4 py-3 pl-6 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {row.orderCode ?? `#${oid}`}
                      </td>
                      <td className="px-4 py-3 text-xs">{labelOrderStatus(row.orderStatus)}</td>
                      <td className="px-4 py-3 font-mono text-sm tabular-nums">
                        {formatMoneyVnd(row.payableTotal ?? row.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {formatDateTime(row.createdAt ?? row.CreatedAt)}
                      </td>
                      <td className="px-4 py-3 pr-6 text-right">
                        {idNum != null ? (
                          <Button variant="outline" size="sm" className="h-8" asChild>
                            <Link to={`${ORDERS_BASE}/${encodeURIComponent(String(idNum))}`}>Mở đơn</Link>
                          </Button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Trước
              </Button>
              <span className="text-xs text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
