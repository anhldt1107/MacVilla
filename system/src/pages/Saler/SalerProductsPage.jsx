import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchStoreProducts, pickStoreRow } from "@/services/store/storeCatalogApi";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pl-9 text-sm shadow-sm",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950"
);

function formatMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

export function SalerProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(() => {
    const v = searchParams.get("inStockOnly");
    return v === "1" || v === "true";
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, inStockOnly]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchStoreProducts({
        page,
        pageSize,
        search: debouncedSearch,
        inStockOnly,
      });
      setData(result);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải được danh sách.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, inStockOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tra cứu sản phẩm</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catalog công khai — chỉ xem, không chỉnh sửa master data.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/saler/quotations/create">Tạo báo giá</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className={fieldInput}
              placeholder="Tên sản phẩm…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
            Chỉ còn hàng
          </label>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3 text-right">Giá từ</th>
                <th className="px-4 py-3 text-right">Biến thể</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Không có sản phẩm phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const id = pickStoreRow(row, "id", "Id");
                  const name = pickStoreRow(row, "name", "Name");
                  const cat = pickStoreRow(row, "categoryName", "CategoryName");
                  const price = pickStoreRow(row, "basePrice", "BasePrice");
                  const vc = pickStoreRow(row, "variantCount", "VariantCount");
                  return (
                    <tr key={id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cat ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{vc ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/saler/products/${id}`)}>
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Trang {page} / {totalPages} · {totalCount} sản phẩm
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Trước
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
