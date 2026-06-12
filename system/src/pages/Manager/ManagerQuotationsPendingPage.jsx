import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  adminQuoteStatusBadgeClass,
  fetchAdminQuoteByCode,
  fetchAdminQuotes,
  formatQuoteDiscount,
  labelAdminQuoteStatus,
} from "@/services/admin/adminQuotesApi";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const BASE = "/manager/sales/quotations";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

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
 * Hàng chờ Manager duyệt —  (status=PendingApproval, sort createdAt giảm dần).
 */
export function ManagerQuotationsPendingPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

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
        search: debouncedSearch || undefined,
        status: "PendingApproval",
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const rawItems = data?.items ?? [];
  const items = useMemo(
    () => [...rawItems].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [rawItems]
  );

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
        navigate(`${BASE}/${Number(id)}`);
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Báo giá — chờ duyệt</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 self-start" asChild>
          <Link to={BASE}>Tất cả báo giá</Link>
        </Button>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tìm trong hàng chờ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Mã QT, khách…"
            className={cn(fieldInput, "sm:max-w-md")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1" disabled={lookupLoading} onClick={() => void lookupByCode()}>
            {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            Mở theo mã
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" disabled={loading} onClick={() => void load()}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Làm mới
          </Button>
        </CardContent>
        {lookupError ? <p className="px-6 pb-3 text-xs text-red-600 dark:text-red-400">{lookupError}</p> : null}
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
          <CardTitle className="text-base">Danh sách (mới nhất trước)</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}/trang
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Trang {page}/{totalPages}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3 pl-6">Mã</th>
                  <th className="px-4 py-3">Gửi / tạo</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3 text-right">Sau giảm</th>
                  <th className="px-4 py-3">Sale soạn</th>
                  <th className="px-4 py-3 pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600/70" />
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Không có báo giá chờ duyệt.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const detailPath = row.id != null ? `${BASE}/${row.id}` : null;
                  return (
                    <tr
                      key={row.id ?? idx}
                      className={cn(
                        detailPath && "cursor-pointer hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/20"
                      )}
                      onClick={() => detailPath && navigate(detailPath)}
                    >
                      <td className="px-4 py-3 pl-6 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {detailPath ? (
                          <Link to={detailPath} className="text-violet-700 hover:underline dark:text-violet-400" onClick={(e) => e.stopPropagation()}>
                            {row.quoteCode}
                          </Link>
                        ) : (
                          row.quoteCode
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{formatDateTime(row.createdAt)}</td>
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="truncate font-medium text-slate-900 dark:text-slate-100">{row.customerName || "—"}</div>
                        <div className="truncate text-[11px] text-slate-500">{row.companyName || row.customerPhone || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums">{formatMoneyVnd(row.finalAmount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{row.salesName || "—"}</td>
                      <td className="px-4 py-3 pr-6">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            adminQuoteStatusBadgeClass(row.status)
                          )}
                        >
                          {labelAdminQuoteStatus(row.status)}
                        </span>
                        <div className="mt-1 text-[11px] text-slate-500">Giảm: {formatQuoteDiscount(row.discountType, row.discountValue)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
