import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  ADMIN_CUSTOMER_DEBT_OPTIONS,
  ADMIN_CUSTOMER_TYPE_OPTIONS,
  fetchAdminCustomers,
} from "@/services/admin/adminCustomersApi";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
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

const fieldSelect = cn(fieldInput, "cursor-pointer appearance-none bg-transparent pr-10");

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

/**
 * @param {{
 *   customersBase: string;
 *   formIdPrefix: string;
 * }} props
 */
export function CustomersListPage({ customersBase, formIdPrefix }) {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [hasDebt, setHasDebt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, customerType, hasDebt, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminCustomers(accessToken, {
        page,
        pageSize,
        search: debouncedSearch,
        customerType,
        hasDebt,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách khách hàng.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, debouncedSearch, customerType, hasDebt]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setCustomerType("");
    setHasDebt("");
  };

  const hasActiveFilters =
    Boolean(searchInput.trim()) || Boolean(customerType) || hasDebt === "true" || hasDebt === "false";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 sm:col-span-2 lg:col-span-5">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor={`${formIdPrefix}-search`}
              >
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id={`${formIdPrefix}-search`}
                  type="search"
                  placeholder="Họ tên, email, số điện thoại…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={cn(fieldInput, "pl-10")}
                />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor={`${formIdPrefix}-type`}
              >
                Loại khách
              </label>
              <div className="relative">
                <select
                  id={`${formIdPrefix}-type`}
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className={fieldSelect}
                >
                  {ADMIN_CUSTOMER_TYPE_OPTIONS.map((o) => (
                    <option key={o.value || "all-type"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor={`${formIdPrefix}-debt`}
              >
                Công nợ
              </label>
              <div className="relative">
                <select
                  id={`${formIdPrefix}-debt`}
                  value={hasDebt}
                  onChange={(e) => setHasDebt(e.target.value)}
                  className={fieldSelect}
                >
                  {ADMIN_CUSTOMER_DEBT_OPTIONS.map((o) => (
                    <option key={o.value || "all-debt"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
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
              {loading ? "Danh sách" : `Danh sách · ${totalCount.toLocaleString("vi-VN")} khách`}
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
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-5 py-3.5 pl-6 font-mono">ID</th>
                  <th className="px-5 py-3.5">Khách hàng</th>
                  <th className="px-5 py-3.5">Loại</th>
                  <th className="px-5 py-3.5">Liên hệ</th>
                  <th className="px-5 py-3.5">Doanh nghiệp</th>
                  <th className="px-5 py-3.5 text-right font-mono">Đơn</th>
                  <th className="px-5 py-3.5 text-right font-mono">Tổng chi</th>
                  <th className="px-5 py-3.5 text-right font-mono">Công nợ</th>
                  <th className="px-5 py-3.5 pr-6">Tạo lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600/70" />
                        <span className="text-sm font-medium">Đang tải dữ liệu…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có khách hàng phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    aria-label={`Xem chi tiết khách ${row.fullName}`}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.06]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                    onClick={() => navigate(`${customersBase}/${row.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`${customersBase}/${row.id}`);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {row.id}
                    </td>
                    <td className="max-w-[220px] px-5 py-3.5 align-middle">
                      <div className="truncate font-medium text-slate-900 dark:text-slate-100">{row.fullName}</div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">{row.email}</div>
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
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {row.phone || "—"}
                    </td>
                    <td className="max-w-[200px] px-5 py-3.5 align-middle">
                      {row.companyName || row.taxCode ? (
                        <>
                          <div className="truncate text-sm text-slate-800 dark:text-slate-200">{row.companyName || "—"}</div>
                          <div className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-500">
                            {row.taxCode || "—"}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right align-middle font-mono text-sm tabular-nums text-slate-800 dark:text-slate-200">
                      {row.orderCount ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right align-middle font-mono text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      {formatMoneyVnd(row.totalSpent)}
                    </td>
                    <td className="px-5 py-3.5 text-right align-middle">
                      <span
                        className={cn(
                          "inline-flex font-mono text-sm tabular-nums",
                          Number(row.debtBalance) > 0
                            ? "font-semibold text-amber-800 dark:text-amber-400"
                            : "text-slate-600 dark:text-slate-400"
                        )}
                      >
                        {formatMoneyVnd(row.debtBalance)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 pr-6 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.createdAt)}
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
                  khách
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
