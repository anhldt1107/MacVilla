import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  ADMIN_QUOTE_STATUS_OPTIONS,
  adminQuoteStatusBadgeClass,
  fetchAdminQuoteByCode,
  fetchAdminQuotes,
  formatQuoteDiscount,
  labelAdminQuoteStatus,
} from "@/services/admin/adminQuotesApi";
import { ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, Filter, Loader2, RefreshCw, Search } from "lucide-react";
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

function formatDateOnly(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const MANAGER_QUOTES_BASE = "/manager/sales/quotations";

/**
 * Danh sách báo giá (Manager) — GET /api/admin/quotes — 
 */
export function ManagerQuotationsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 450);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminQuotes(accessToken, {
        page,
        pageSize,
        search: debouncedSearch,
        status,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách báo giá.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, debouncedSearch, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatus("");
  };

  const hasActiveFilters = Boolean(searchInput.trim() || status);

  const lookupByCode = async () => {
    if (!accessToken) return;
    const q = searchInput.trim();
    if (!q) {
      setLookupError("Nhập mã báo giá.");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    try {
      const d = await fetchAdminQuoteByCode(accessToken, q);
      const id = d?.id ?? d?.Id;
      if (id != null && Number.isFinite(Number(id))) {
        navigate(`${MANAGER_QUOTES_BASE}/${Number(id)}`);
      } else {
        setLookupError("Không tìm thấy báo giá.");
      }
    } catch (e) {
      setLookupError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tra cứu thất bại.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Báo giá — tất cả</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/manager/sales/quotations/pending">Hàng chờ duyệt</Link>
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:shadow-none">
        <CardHeader className="space-y-1 border-b border-slate-100 bg-gradient-to-br from-indigo-50/90 to-white pb-4 dark:border-slate-800 dark:from-indigo-950/30 dark:to-slate-950">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-800 dark:text-indigo-300">
              <Filter className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Bộ lọc báo giá</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 sm:col-span-2 lg:col-span-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="admin-quote-search">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-quote-search"
                  type="search"
                  placeholder="Mã QT, tên khách, SĐT…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={cn(fieldInput, "pl-10")}
                />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="admin-quote-status">
                Trạng thái
              </label>
              <div className="relative">
                <select id="admin-quote-status" value={status} onChange={(e) => setStatus(e.target.value)} className={fieldSelect}>
                  {ADMIN_QUOTE_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
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
              <Button type="button" size="sm" className="gap-1.5 shadow-sm" onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Làm mới
              </Button>
              <Button type="button" variant="secondary" size="sm" className="gap-1.5" disabled={lookupLoading} onClick={() => void lookupByCode()}>
                {lookupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Mở theo mã
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                Xóa bộ lọc
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">

            </p>
          </div>
          {lookupError ? (
            <p className="border-t border-slate-100 px-5 pb-3 text-xs text-red-600 dark:border-slate-800 dark:text-red-400">{lookupError}</p>
          ) : null}
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
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-800 ring-1 ring-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/25">
              <FileSpreadsheet className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                {loading ? "Danh sách báo giá (B2B)" : `Danh sách báo giá (B2B) · ${totalCount.toLocaleString("vi-VN")} báo giá`}
              </CardTitle>
            </div>
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
              Trang <span className="tabular-nums text-foreground">{page}</span> / {totalPages}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3.5 pl-6">Mã báo giá</th>
                  <th className="px-4 py-3.5">Tạo lúc</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Khách / công ty</th>
                  <th className="px-4 py-3.5 text-right">Dòng</th>
                  <th className="px-4 py-3.5 text-right">Tổng</th>
                  <th className="px-4 py-3.5 text-right">Giảm</th>
                  <th className="px-4 py-3.5 text-right">Sau giảm</th>
                  <th className="px-4 py-3.5">Hiệu lực</th>
                  <th className="px-4 py-3.5 pr-6">Sale / QL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600/70" aria-hidden />
                        <span className="text-sm font-medium">Đang tải báo giá…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có báo giá phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc hoặc từ khóa.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const detailPath = row.id != null ? `${MANAGER_QUOTES_BASE}/${row.id}` : null;
                  return (
                  <tr
                    key={row.id}
                    role={detailPath ? "button" : undefined}
                    tabIndex={detailPath ? 0 : undefined}
                    className={cn(
                      detailPath && "cursor-pointer",
                      "transition-colors hover:bg-indigo-500/[0.03] dark:hover:bg-indigo-500/[0.06]",
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
                    <td className="whitespace-nowrap px-4 py-3.5 pl-6 align-middle">
                      {detailPath ? (
                        <Link
                          to={detailPath}
                          className="inline-flex rounded-md bg-indigo-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-900 ring-1 ring-indigo-500/15 transition-colors hover:bg-indigo-500/15 hover:ring-indigo-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-100 dark:ring-indigo-800/40"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.quoteCode}
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-md bg-indigo-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-900 ring-1 ring-indigo-500/15 dark:bg-indigo-950/40 dark:text-indigo-100 dark:ring-indigo-800/40">
                          {row.quoteCode}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex max-w-[11rem] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          adminQuoteStatusBadgeClass(row.status)
                        )}
                        title={row.status}
                      >
                        {labelAdminQuoteStatus(row.status)}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3.5 align-middle">
                      <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {row.customerId ? (
                          <Link
                            to={`/manager/sales/customers/${row.customerId}`}
                            className="text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.customerName || `Khách #${row.customerId}`}
                          </Link>
                        ) : (
                          (row.customerName ?? "—")
                        )}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">{row.companyName || row.customerPhone || "—"}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right align-middle tabular-nums text-slate-700 dark:text-slate-300">{row.lineCount}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100">
                      {formatMoneyVnd(row.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {formatQuoteDiscount(row.discountType, row.discountValue)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatMoneyVnd(row.finalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateOnly(row.validUntil)}
                    </td>
                    <td className="max-w-[140px] px-4 py-3.5 pr-6 align-middle text-xs text-slate-600 dark:text-slate-400">
                      <div className="truncate" title={row.salesName || ""}>
                        {row.salesName || "—"}
                      </div>
                      <div className="truncate text-[11px] text-slate-500" title={row.managerName || ""}>
                        {row.managerName || ""}
                      </div>
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
                  / {totalCount.toLocaleString("vi-VN")} báo giá
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
