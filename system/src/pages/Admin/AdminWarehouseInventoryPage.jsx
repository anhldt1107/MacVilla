import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminWarehouseInventoryPage, fetchAdminWarehouseOverview } from "@/services/admin/adminWarehouseApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Loader2, RefreshCw } from "lucide-react";

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];
const DEFAULT_THRESHOLD = "10";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldCheckbox = "h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30";

/**
 * @param {Record<string, unknown>} obj
 * @param {string} camel
 * @param {string} pascal
 */
function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/**
 * @param {unknown} data
 */
function asPagedItems(data) {
  if (!data || typeof data !== "object") return { items: [], totalCount: 0, page: 1, pageSize: 50 };
  const o = /** @type {Record<string, unknown>} */ (data);
  const itemsRaw = o.items ?? o.Items;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((x) => (x && typeof x === "object" ? /** @type {Record<string, unknown>} */ (x) : {}))
    : [];
  const totalCount = Number(pick(o, "totalCount", "TotalCount")) || 0;
  const page = Number(pick(o, "page", "Page")) || 1;
  const pageSize = Number(pick(o, "pageSize", "PageSize")) || 50;
  return { items, totalCount, page, pageSize };
}

function parseThreshold(value) {
  return Math.max(0, Math.floor(Number(String(value).replace(",", ".")) || 10));
}

/**
 * @param {string | number | undefined | null} productId
 * @param {string | number | undefined | null} variantId
 * @param {"admin" | "stock-manager"} linkMode
 */
function variantDetailHref(productId, variantId, linkMode) {
  const p = String(productId ?? "").trim();
  const v = String(variantId ?? "").trim();
  if (!p || !v) return null;
  if (linkMode === "stock-manager") {
    return `/stock-manager/inventory?${new URLSearchParams({ productId: p, variantId: v }).toString()}`;
  }
  return `/admin/products/${encodeURIComponent(p)}/variants/${encodeURIComponent(v)}`;
}

function KpiTile({ label, value, tone = "neutral", loading }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/25"
      : tone === "red"
        ? "border-red-200/80 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/25"
        : "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40";

  const valueClass =
    tone === "amber"
      ? "text-amber-900 dark:text-amber-100"
      : tone === "red"
        ? "text-red-900 dark:text-red-100"
        : "text-slate-900 dark:text-slate-100";

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          …
        </div>
      ) : (
        <p className={cn("mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
      )}
    </div>
  );
}

/**
 * @param {{
 *   variantDetailLinkMode?: "admin" | "stock-manager";
 *   stockMovementsTo?: string;
 * }} [props]
 */
export function AdminWarehouseInventoryPage({
  variantDetailLinkMode = "admin",
  stockMovementsTo = "/admin/logistics/stock-movements",
} = {}) {
  const { accessToken, isAuthenticated } = useAuth();

  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [overview, setOverview] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [ovLoading, setOvLoading] = useState(false);
  const [ovErr, setOvErr] = useState("");

  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(50);
  const [invSearchInput, setInvSearchInput] = useState("");
  const [debouncedInvSearch, setDebouncedInvSearch] = useState("");
  const [invWhLoc, setInvWhLoc] = useState("");
  const [invOnlyOos, setInvOnlyOos] = useState(false);
  const [invOnlyBelow, setInvOnlyBelow] = useState(true);
  const [invItems, setInvItems] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [invTotal, setInvTotal] = useState(0);
  const [invLoading, setInvLoading] = useState(false);
  const [invErr, setInvErr] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInvSearch(invSearchInput.trim()), 450);
    return () => clearTimeout(t);
  }, [invSearchInput]);

  useEffect(() => {
    setInvPage(1);
  }, [debouncedInvSearch, invWhLoc, threshold, invOnlyOos, invOnlyBelow, invPageSize]);

  const loadOverview = useCallback(async () => {
    if (!accessToken) return;
    setOvLoading(true);
    setOvErr("");
    try {
      const data = await fetchAdminWarehouseOverview(accessToken, {
        lowStockThreshold: parseThreshold(threshold),
      });
      setOverview(data && typeof data === "object" ? /** @type {Record<string, unknown>} */ (data) : null);
    } catch (e) {
      setOverview(null);
      setOvErr(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải được tổng quan.");
    } finally {
      setOvLoading(false);
    }
  }, [accessToken, threshold]);

  const loadInventory = useCallback(async () => {
    if (!accessToken) return;
    setInvLoading(true);
    setInvErr("");
    try {
      const data = await fetchAdminWarehouseInventoryPage(accessToken, {
        page: invPage,
        pageSize: invPageSize,
        search: debouncedInvSearch || undefined,
        warehouseLocation: invWhLoc.trim() || undefined,
        onlyOutOfStock: invOnlyOos,
        onlyBelowThreshold: invOnlyBelow,
        threshold: parseThreshold(threshold),
      });
      const { items, totalCount } = asPagedItems(data);
      setInvItems(items);
      setInvTotal(totalCount);
    } catch (e) {
      setInvItems([]);
      setInvTotal(0);
      setInvErr(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải danh sách tồn.");
    } finally {
      setInvLoading(false);
    }
  }, [accessToken, invPage, invPageSize, debouncedInvSearch, invWhLoc, threshold, invOnlyOos, invOnlyBelow]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    void loadOverview();
  }, [isAuthenticated, accessToken, loadOverview]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    void loadInventory();
  }, [isAuthenticated, accessToken, loadInventory]);

  const refreshAll = useCallback(() => {
    void loadOverview();
    void loadInventory();
  }, [loadOverview, loadInventory]);

  const invTotalPages = Math.max(1, Math.ceil(invTotal / invPageSize) || 1);
  const rangeStart = invTotal > 0 ? (invPage - 1) * invPageSize + 1 : 0;
  const rangeEnd = invTotal > 0 ? Math.min(invPage * invPageSize, invTotal) : 0;
  const busy = ovLoading || invLoading;

  const clearFilters = () => {
    setInvSearchInput("");
    setDebouncedInvSearch("");
    setInvWhLoc("");
    setThreshold(DEFAULT_THRESHOLD);
    setInvOnlyOos(false);
    setInvOnlyBelow(true);
    setInvPage(1);
  };

  const hasActiveFilters =
    Boolean(invSearchInput.trim()) ||
    Boolean(invWhLoc.trim()) ||
    threshold !== DEFAULT_THRESHOLD ||
    invOnlyOos ||
    !invOnlyBelow;

  const num = (v) => (v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toLocaleString("vi-VN"));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 py-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">Tồn kho</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="gap-1.5" asChild>
              <Link to={stockMovementsTo}>
                Giao dịch kho
                <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
              disabled={!accessToken || busy}
              onClick={() => refreshAll()}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiTile
              label="Tồn thấp / cần đặt lại"
              value={num(pick(overview, "lowStockCount", "LowStockCount"))}
              tone="amber"
              loading={ovLoading && !overview}
            />
            <KpiTile
              label="Hết hàng"
              value={num(pick(overview, "outOfStockCount", "OutOfStockCount"))}
              tone="red"
              loading={ovLoading && !overview}
            />
            <KpiTile
              label="Ngưỡng chung"
              value={num(pick(overview, "lowStockThreshold", "LowStockThreshold") ?? parseThreshold(threshold))}
              loading={ovLoading && !overview}
            />
          </div>

          {ovErr ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {ovErr}
            </p>
          ) : null}

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-12 lg:items-end dark:border-slate-800">
            <div className="space-y-2 sm:col-span-2 lg:col-span-4">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="wh-inv-q"
              >
                Tìm kiếm
              </label>
              <input
                id="wh-inv-q"
                type="search"
                className={fieldInput}
                value={invSearchInput}
                onChange={(e) => setInvSearchInput(e.target.value)}
                placeholder="SKU, tên sản phẩm…"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="wh-inv-loc"
              >
                Vị trí kho
              </label>
              <input
                id="wh-inv-loc"
                type="text"
                className={fieldInput}
                value={invWhLoc}
                onChange={(e) => setInvWhLoc(e.target.value)}
                placeholder="Mã vị trí…"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="wh-threshold"
              >
                Ngưỡng chung
              </label>
              <input
                id="wh-threshold"
                type="number"
                min={0}
                step={1}
                className={fieldInput}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:col-span-3 lg:min-h-10 lg:pb-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  className={fieldCheckbox}
                  checked={invOnlyBelow}
                  onChange={(e) => setInvOnlyBelow(e.target.checked)}
                />
                Chỉ tồn thấp
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  className={fieldCheckbox}
                  checked={invOnlyOos}
                  onChange={(e) => setInvOnlyOos(e.target.checked)}
                />
                Chỉ hết hàng
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
              <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>

        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {invLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Đang tải danh sách…
                </span>
              ) : (
                <>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{invTotal.toLocaleString("vi-VN")}</span> SKU
                  {invTotal > 0 ? (
                    <span className="text-slate-500">
                      {" "}
                      · dòng {rangeStart.toLocaleString("vi-VN")}–{rangeEnd.toLocaleString("vi-VN")}
                    </span>
                  ) : null}
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <span className="font-medium text-slate-600 dark:text-slate-300">Hiển thị</span>
                <div className="relative">
                  <select
                    value={String(invPageSize)}
                    onChange={(e) => {
                      setInvPageSize(Number(e.target.value) || 50);
                      setInvPage(1);
                    }}
                    className="h-7 min-w-[5.5rem] cursor-pointer appearance-none rounded-md border-0 bg-transparent pr-6 text-sm font-semibold text-foreground focus:ring-0"
                    aria-label="Số dòng mỗi trang"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} / trang
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={invLoading || invPage <= 1}
                  onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Trước
                </Button>
                <span className="min-w-[4.5rem] text-center font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                  {invPage} / {invTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={invLoading || invPage >= invTotalPages}
                  onClick={() => setInvPage((p) => p + 1)}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>

          {invErr ? (
            <p className="border-b border-red-100 bg-red-50/80 px-4 py-2.5 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 sm:px-5" role="alert">
              {invErr}
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-5 py-3 first:pl-6">SKU</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Biến thể</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3 text-right">Khả dụng</th>
                  <th className="px-4 py-3">Cảnh báo</th>
                  <th className="px-4 py-3 text-right">Ngưỡng</th>
                  <th className="px-4 py-3 text-right">Đặt lại / AT</th>
                  <th className="px-5 py-3 pr-6 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {invItems.length === 0 && !invLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-14 text-center text-sm text-slate-600 dark:text-slate-300">
                      Không có dòng phù hợp. Thử bỏ bớt lọc hoặc đổi ngưỡng chung.
                    </td>
                  </tr>
                ) : null}
                {invItems.map((r, i) => {
                  const vid = pick(r, "variantId", "VariantId");
                  const pid = pick(r, "productId", "ProductId");
                  const href = variantDetailHref(pid, vid, variantDetailLinkMode);
                  const low = pick(r, "isLowStock", "IsLowStock");
                  const qty = pick(r, "quantityAvailable", "QuantityAvailable");
                  const eff = pick(r, "effectiveLowStockThreshold", "EffectiveLowStockThreshold");
                  const rp = pick(r, "reorderPoint", "ReorderPoint");
                  const ss = pick(r, "safetyStock", "SafetyStock");
                  const loc = pick(r, "warehouseLocation", "WarehouseLocation");
                  const isOos = qty != null && Number(qty) <= 0;

                  return (
                    <tr
                      key={`${String(pick(r, "inventoryId", "InventoryId"))}-${i}`}
                      className={cn(
                        "border-b border-slate-100 transition-colors hover:bg-slate-500/[0.04] dark:border-slate-800 dark:hover:bg-slate-500/[0.06]",
                        (low === true || isOos) && "bg-amber-50/30 dark:bg-amber-950/10",
                        isOos && "bg-red-50/20 dark:bg-red-950/10"
                      )}
                    >
                      <td className="whitespace-nowrap px-5 py-3 pl-6 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                        {String(pick(r, "sku", "Sku") ?? "—")}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3" title={String(pick(r, "productName", "ProductName") ?? "")}>
                        {String(pick(r, "productName", "ProductName") ?? "—")}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-slate-700 dark:text-slate-300" title={String(pick(r, "variantName", "VariantName") ?? "")}>
                        {String(pick(r, "variantName", "VariantName") ?? "—")}
                      </td>
                      <td className="max-w-[100px] truncate px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {loc != null && String(loc).trim() !== "" ? String(loc) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums font-medium">{num(qty)}</td>
                      <td className="px-4 py-3">
                        {isOos ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-200">
                            Hết hàng
                          </span>
                        ) : low === true ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                            Tồn thấp
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Ổn định</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                        {num(eff)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-500">
                        {rp != null ? num(rp) : "—"} / {ss != null ? num(ss) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 pr-6 text-right">
                        {href ? (
                          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
                            <Link to={href}>Chi tiết</Link>
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
        </div>
      </Card>
    </div>
  );
}
