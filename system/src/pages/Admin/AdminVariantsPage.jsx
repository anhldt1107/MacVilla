import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminVariants } from "@/services/admin/adminVariantsApi";
import {
  adminProductStatusBadgeClass,
  labelAdminProductStatus,
} from "@/services/admin/adminProductsApi";
import { ChevronLeft, ChevronRight, ImageIcon, Layers, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function formatPriceVND(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

export function AdminVariantsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminVariants(accessToken, {
        page,
        pageSize,
        search: search.trim(),
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách biến thể.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
  };

  const hasActiveFilters = Boolean(searchInput.trim());

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 sm:col-span-2 lg:col-span-8">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-variant-search"
              >
                Tìm kiếm
              </label>
              <input
                id="admin-variant-search"
                type="search"
                placeholder="SKU, tên biến thể, sản phẩm…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={fieldInput}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
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
              <Link
                to="/admin/products"
                className="text-sm font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
              >
                Sản phẩm
              </Link>
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
            <CardTitle className="text-lg font-semibold tracking-tight">Biến thể</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              {loading ? "Đang đồng bộ dữ liệu…" : `${totalCount.toLocaleString("vi-VN")} biến thể`}
            </CardDescription>
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
                  <th className="w-16 py-3.5 pl-6 pr-2">Ảnh</th>
                  <th className="px-3 py-3.5">SKU / Biến thể</th>
                  <th className="px-3 py-3.5">Sản phẩm</th>
                  <th className="px-3 py-3.5">Danh mục</th>
                  <th className="whitespace-nowrap px-3 py-3.5 text-right">Giá bán</th>
                  <th className="whitespace-nowrap px-3 py-3.5 text-right">Giá vốn</th>
                  <th className="whitespace-nowrap px-3 py-3.5 text-center">Tồn khả dụng</th>
                  <th className="px-3 py-3.5">Trạng thái SP</th>
                  <th className="whitespace-nowrap py-3.5 pl-3 pr-6 font-mono">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-600/70" />
                        <span className="text-sm font-medium">Đang tải biến thể…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có biến thể phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi từ khóa tìm kiếm.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-teal-500/[0.04] dark:hover:bg-teal-500/[0.06]",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                    onClick={() => navigate(`/admin/products/${row.productId}/variants/${row.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/admin/products/${row.productId}/variants/${row.id}`);
                      }
                    }}
                  >
                    <td className="py-3.5 pl-6 pr-2 align-middle">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                          <ImageIcon className="h-5 w-5 text-slate-400" aria-hidden />
                        </span>
                      )}
                    </td>
                    <td className="max-w-[220px] px-3 py-3.5 align-middle">
                      <div className="truncate font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{row.sku}</div>
                      <div className="mt-0.5 truncate text-sm text-slate-700 dark:text-slate-300">{row.variantName}</div>
                    </td>
                    <td className="max-w-[240px] px-3 py-3.5 align-middle">
                      <div className="truncate font-medium text-slate-900 dark:text-slate-100">{row.productName}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">SP #{row.productId}</div>
                    </td>
                    <td className="max-w-[180px] px-3 py-3.5 align-middle text-sm text-slate-800 dark:text-slate-200">
                      <div className="truncate" title={row.categoryName}>
                        {row.categoryName || "—"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatPriceVND(row.retailPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle font-mono text-sm tabular-nums text-slate-700 dark:text-slate-300">
                      {formatPriceVND(row.costPrice)}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      <span title={`Tồn: ${row.quantityOnHand}, Giữ: ${row.quantityReserved}`}>
                        {row.quantityAvailable ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          adminProductStatusBadgeClass(row.productStatus)
                        )}
                      >
                        {labelAdminProductStatus(row.productStatus)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-3 pr-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      #{row.id}
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
                  biến thể
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
              <span className="min-w-[5rem] text-center font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
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
