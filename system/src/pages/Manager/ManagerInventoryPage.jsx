import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { AdminVariantSearchPicker } from "@/components/Admin/inventory/AdminVariantSearchPicker";
import { VariantInventoryReorderPolicy } from "@/components/Admin/inventory/VariantInventoryReorderPolicy";
import {
  fetchAdminProductVariantInventory,
  upsertAdminProductVariantInventory,
} from "@/services/admin/adminProductsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, Package, RefreshCw } from "lucide-react";

const WH_LOC_MAX = 500;
const DEFAULT_STOCK_MOVEMENTS_BASE = "/manager/logistics/stock-movements";
const DEFAULT_VARIANT_PICKER_PREFIX = "manager-inventory-variant";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

/**
 * @param {Record<string, unknown>} obj
 * @param {string} camel
 * @param {string} pascal
 */
function pickField(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/**
 * @param {Record<string, unknown>} o
 * @param {string} camel
 * @param {string} pascal
 * @returns {number | null}
 */
function pickNullableNumber(o, camel, pascal) {
  const v = camel in o ? o[camel] : pascal in o ? o[pascal] : undefined;
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Tồn kho theo biến thể — GET/PUT `/products/…/variants/…/inventory`, PUT reorder-policy ().
 * @param {{
 *   stockMovementsBase?: string;
 *   variantPickerIdPrefix?: string;
 *   leadCardTitle?: string;
 *   leadCardDescription?: import("react").ReactNode;
 *   initialVariantId?: string;
 *   initialProductId?: string;
 *   skuFormOnly?: boolean;
 * }} [props]
 * @description `skuFormOnly`: chỉ form số liệu / lưu / ngưỡng, ẩn card chọn SKU (popup đã biết biến thể).
 */
export function ManagerInventoryPage(props = {}) {
  const {
    stockMovementsBase = DEFAULT_STOCK_MOVEMENTS_BASE,
    variantPickerIdPrefix = DEFAULT_VARIANT_PICKER_PREFIX,
    leadCardTitle = "Tồn kho theo biến thể",
    leadCardDescription: leadCardDescriptionProp,
    initialVariantId = "",
    initialProductId = "",
    skuFormOnly = false,
  } = props;

  const leadCardDescription =
    leadCardDescriptionProp ??
    (
      <>
        Chọn SKU từ danh sách tìm kiếm để xem và cập nhật tồn (GET/PUT{" "}
        <span className="font-mono text-xs">/products/…/variants/…/inventory</span>).
      </>
    );

  const { accessToken, isAuthenticated } = useAuth();
  const [variantId, setVariantId] = useState(() => String(initialVariantId ?? "").trim());
  const [productId, setProductId] = useState(() => String(initialProductId ?? "").trim());
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState("");
  const [invHasRecord, setInvHasRecord] = useState(false);
  const [invForm, setInvForm] = useState({
    warehouseLocation: "",
    quantityOnHand: "0",
    quantityReserved: "0",
  });
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [invSaveError, setInvSaveError] = useState("");
  const [invPolicy, setInvPolicy] = useState(
    /** @type {{ reorderPoint: number | null; safetyStock: number | null } | null} */ (null)
  );

  const canLoad = Boolean(isAuthenticated && accessToken && productId.trim() && variantId.trim());

  const loadInventory = useCallback(async () => {
    if (!canLoad || !accessToken) return;
    const pid = productId.trim();
    const vid = variantId.trim();
    setInvLoading(true);
    setInvError("");
    setInvSaveError("");
    try {
      const inv = await fetchAdminProductVariantInventory(accessToken, pid, vid);
      if (inv == null) {
        setInvHasRecord(false);
        setInvPolicy(null);
        setInvForm({
          warehouseLocation: "",
          quantityOnHand: "0",
          quantityReserved: "0",
        });
      } else {
        const o = /** @type {Record<string, unknown>} */ (inv);
        setInvHasRecord(true);
        setInvPolicy({
          reorderPoint: pickNullableNumber(o, "reorderPoint", "ReorderPoint"),
          safetyStock: pickNullableNumber(o, "safetyStock", "SafetyStock"),
        });
        const loc = pickField(o, "warehouseLocation", "WarehouseLocation");
        const oh = pickField(o, "quantityOnHand", "QuantityOnHand");
        const rs = pickField(o, "quantityReserved", "QuantityReserved");
        setInvForm({
          warehouseLocation: loc != null ? String(loc) : "",
          quantityOnHand: oh != null ? String(oh) : "0",
          quantityReserved: rs != null ? String(rs) : "0",
        });
      }
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được tồn kho.";
      setInvError(msg);
    } finally {
      setInvLoading(false);
    }
  }, [accessToken, canLoad, productId, variantId]);

  useEffect(() => {
    const iv = String(initialVariantId ?? "").trim();
    const ip = String(initialProductId ?? "").trim();
    if (iv) setVariantId(iv);
    if (ip) setProductId(ip);
  }, [initialVariantId, initialProductId]);

  useEffect(() => {
    if (!canLoad) {
      setInvError("");
      return;
    }
    void loadInventory();
  }, [canLoad, loadInventory]);

  const submitInventory = async () => {
    if (!accessToken || !canLoad || invSubmitting) return;
    const oh = Number(invForm.quantityOnHand);
    const rs = Number(invForm.quantityReserved);
    if (!Number.isFinite(oh) || !Number.isInteger(oh) || oh < 0 || !Number.isFinite(rs) || !Number.isInteger(rs) || rs < 0) {
      setInvSaveError("Tồn thực tế và đang giữ phải là số nguyên không âm.");
      return;
    }
    if (rs > oh) {
      setInvSaveError("Số đang giữ không được lớn hơn tồn thực tế.");
      return;
    }
    const loc = invForm.warehouseLocation.trim();
    if (loc.length > WH_LOC_MAX) {
      setInvSaveError(`Vị trí kho tối đa ${WH_LOC_MAX} ký tự.`);
      return;
    }
    setInvSubmitting(true);
    setInvSaveError("");
    try {
      await upsertAdminProductVariantInventory(accessToken, productId.trim(), variantId.trim(), {
        warehouseLocation: loc || undefined,
        quantityOnHand: oh,
        quantityReserved: rs,
      });
      setInvHasRecord(true);
      await loadInventory();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không lưu được tồn kho.";
      setInvSaveError(msg);
    } finally {
      setInvSubmitting(false);
    }
  };

  const movementsHref =
    variantId.trim() !== ""
      ? `${stockMovementsBase}?variantId=${encodeURIComponent(variantId.trim())}`
      : stockMovementsBase;

  const derivedAvailable = (() => {
    const oh = Number(invForm.quantityOnHand);
    const rs = Number(invForm.quantityReserved);
    return Number.isFinite(oh) && Number.isFinite(rs) ? oh - rs : null;
  })();

  return (
    <div className={cn("mx-auto space-y-6", skuFormOnly ? "max-w-none pb-0" : "max-w-3xl pb-10")}>
      {!skuFormOnly ? (
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-800 ring-1 ring-teal-500/20 dark:text-teal-300 dark:ring-teal-500/25">
                <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">{leadCardTitle}</CardTitle>
                <CardDescription className="mt-1 text-sm">{leadCardDescription}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <AdminVariantSearchPicker
              accessToken={accessToken}
              value={variantId}
              onChange={(id) => {
                setVariantId(id);
                if (!id.trim()) setProductId("");
              }}
              onVariantPick={(v) => {
                setProductId(String(v.productId ?? ""));
              }}
              idPrefix={variantPickerIdPrefix}
              label="Biến thể (SKU)"
              placeholder="Gõ SKU hoặc tên để tìm…"
            />
            {!productId && variantId.trim() ? (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Chọn lại biến thể từ danh sách gợi ý để cập nhật tồn kho.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={!canLoad || invLoading} onClick={() => void loadInventory()}>
                {invLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Làm mới tồn
              </Button>
              <Button type="button" size="sm" variant="secondary" className="gap-1.5" asChild>
                <Link to={movementsHref}>
                  Giao dịch kho
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {invError ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {invError}
        </div>
      ) : null}

      {canLoad ? (
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Số liệu tồn</CardTitle>
                <CardDescription>
                  {invHasRecord ? "Đã có bản ghi tồn trên server." : "Chưa có bản ghi — lưu lần đầu sẽ tạo tồn."}
                </CardDescription>
              </div>
              {skuFormOnly ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={!canLoad || invLoading} onClick={() => void loadInventory()}>
                    {invLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Làm mới tồn
                  </Button>
                  <Button type="button" size="sm" variant="secondary" className="gap-1.5" asChild>
                    <Link to={movementsHref}>
                      Giao dịch kho
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {invLoading && !invError ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Đang tải…
              </div>
            ) : null}

            {!invLoading ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Tồn thực tế</p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {invForm.quantityOnHand}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Đang giữ</p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {invForm.quantityReserved}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Khả dụng (ước tính)</p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {derivedAvailable != null && Number.isFinite(derivedAvailable) ? derivedAvailable : "—"}
                    </p>
                  </div>
                </div>
                {derivedAvailable != null && derivedAvailable < 0 ? (
                  <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
                    Cảnh báo: tồn khả dụng âm — kiểm tra đặt giữ hoặc dùng giao dịch ADJUST có lý do rõ ràng.
                  </p>
                ) : null}

                <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor={`${variantPickerIdPrefix}-loc`}>
                    Vị trí kho
                  </label>
                  <input
                    id={`${variantPickerIdPrefix}-loc`}
                    type="text"
                    maxLength={WH_LOC_MAX}
                    value={invForm.warehouseLocation}
                    onChange={(e) => setInvForm((f) => ({ ...f, warehouseLocation: e.target.value }))}
                    className={fieldInput}
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor={`${variantPickerIdPrefix}-oh`}>
                      Tồn thực tế (PUT)
                    </label>
                    <input
                      id={`${variantPickerIdPrefix}-oh`}
                      type="number"
                      min={0}
                      step={1}
                      value={invForm.quantityOnHand}
                      onChange={(e) => setInvForm((f) => ({ ...f, quantityOnHand: e.target.value }))}
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor={`${variantPickerIdPrefix}-rs`}>
                      Đang giữ
                    </label>
                    <input
                      id={`${variantPickerIdPrefix}-rs`}
                      type="number"
                      min={0}
                      step={1}
                      value={invForm.quantityReserved}
                      onChange={(e) => setInvForm((f) => ({ ...f, quantityReserved: e.target.value }))}
                      className={fieldInput}
                    />
                  </div>
                </div>

                {invSaveError ? (
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {invSaveError}
                  </p>
                ) : null}

                <Button type="button" onClick={() => void submitInventory()} disabled={invSubmitting || invLoading}>
                  {invSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Lưu tồn kho
                </Button>
                <VariantInventoryReorderPolicy
                  accessToken={accessToken}
                  productId={productId.trim()}
                  variantId={variantId.trim()}
                  enabled={invHasRecord}
                  reorderPoint={invPolicy?.reorderPoint}
                  safetyStock={invPolicy?.safetyStock}
                  onSaved={(data) => {
                    const o = /** @type {Record<string, unknown>} */ (data);
                    setInvPolicy({
                      reorderPoint: pickNullableNumber(o, "reorderPoint", "ReorderPoint"),
                      safetyStock: pickNullableNumber(o, "safetyStock", "SafetyStock"),
                    });
                    void loadInventory();
                  }}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập thêm / điều chỉnh delta: dùng mục{" "}
                  <Link className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400" to={movementsHref}>
                    Giao dịch kho
                  </Link>{" "}
                  để nhập kho hoặc điều chỉnh số lượng.
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
