import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  deleteAdminProductVariant,
  fetchAdminProductVariantDetail,
  fetchAdminProductVariantInventory,
  updateAdminProductVariant,
  upsertAdminProductVariantInventory,
} from "@/services/admin/adminProductsApi";
import { uploadAdminFile } from "@/services/admin/adminUploadsApi";
import {
  fetchAdminInventoryTransactions,
  inventoryReferenceTypeBadgeClass,
  inventoryTransactionTypeBadgeClass,
  labelInventoryReferenceType,
  labelInventoryTransactionType,
} from "@/services/admin/adminInventoryTransactionsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VariantInventoryReorderPolicy } from "@/components/Admin/inventory/VariantInventoryReorderPolicy";
import { ChevronLeft, ChevronRight, ImageIcon, Layers, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const VARIANTS_LIST_PATH = "/admin/variants";
const PRODUCTS_LIST_PATH = "/admin/products";

const TX_PAGE_SIZES = [10, 20, 50];

const SKU_MAX = 450;
const VARIANT_NAME_MAX = 500;
const DIM_MAX = 500;
const IMG_URL_MAX = 2000;
const WH_LOC_MAX = 500;

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-teal-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

/**
 * @param {Record<string, unknown> | null | undefined} obj
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
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminVariantDetailPage() {
  const { productId: productIdParam, variantId: variantIdParam } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, user } = useAuth();
  const canAccessWarehouse = user?.canAccessWarehouse === true;

  const [detailTab, setDetailTab] = useState(/** @type {"info" | "history"} */ ("info"));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [variant, setVariant] = useState(
    /** @type {import("@/services/admin/adminProductsApi").AdminProductVariantDetail | null} */ (null)
  );

  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(20);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [txData, setTxData] = useState(null);

  const [editForm, setEditForm] = useState({
    sku: "",
    variantName: "",
    retailPrice: "",
    costPrice: "",
    weight: "",
    dimensions: "",
    imageUrl: "",
  });
  const [editImageFile, setEditImageFile] = useState(/** @type {File | null} */ (null));
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState("");
  const [invHasRecord, setInvHasRecord] = useState(false);
  const [invForm, setInvForm] = useState({ warehouseLocation: "", quantityOnHand: "", quantityReserved: "" });
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [invSaveError, setInvSaveError] = useState("");
  const [invPolicy, setInvPolicy] = useState(
    /** @type {{ reorderPoint: number | null; safetyStock: number | null } | null} */ (null)
  );

  const productId = String(productIdParam ?? "").trim();
  const variantId = String(variantIdParam ?? "").trim();

  const loadVariant = useCallback(
    /**
     * @param {{ silent?: boolean }} [opts]: làm mới dữ liệu không bật skeleton toàn trang.
     */
    async (opts) => {
      const silent = opts?.silent === true;
      if (!isAuthenticated || !accessToken || !productId || !variantId) {
        if (!silent) setLoading(false);
        return null;
      }
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const v = await fetchAdminProductVariantDetail(accessToken, productId, variantId);
        setVariant(v);
        return v;
      } catch (e) {
        const msg =
          e instanceof ApiRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Không tải được chi tiết biến thể.";
        if (!silent) {
          setError(msg);
          setVariant(null);
        }
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [accessToken, isAuthenticated, productId, variantId]
  );

  useEffect(() => {
    void loadVariant();
  }, [loadVariant]);

  useEffect(() => {
    if (!variant) return;
    setEditForm({
      sku: variant.sku ?? "",
      variantName: variant.variantName ?? "",
      retailPrice: variant.retailPrice != null ? String(variant.retailPrice) : "",
      costPrice: variant.costPrice != null ? String(variant.costPrice) : "",
      weight: variant.weight != null ? String(variant.weight) : "",
      dimensions: (variant.dimensions && String(variant.dimensions)) || "",
      imageUrl: (variant.imageUrl && String(variant.imageUrl)) || "",
    });
    setEditImageFile(null);
    setEditError("");
  }, [variant]);

  /**
   * @param {import("@/services/admin/adminProductsApi").AdminProductVariantDetail | null | undefined} [defaultsSource] — dùng khi GET 404, mặc định lấy từ `variant` trong closure.
   */
  const loadInventory = useCallback(
    async (defaultsSource) => {
      if (!canAccessWarehouse || !accessToken || !productId || !variantId) return;
      const dv = defaultsSource ?? variant;
      setInvLoading(true);
      setInvError("");
      try {
        const inv = await fetchAdminProductVariantInventory(accessToken, productId, variantId);
        if (inv == null) {
          setInvHasRecord(false);
          setInvPolicy(null);
          setInvForm({
            warehouseLocation: "",
            quantityOnHand: String(dv?.quantityOnHand ?? 0),
            quantityReserved: String(dv?.quantityReserved ?? 0),
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
              : "Không tải được tồn kho theo biến thể.";
        setInvError(msg);
      } finally {
        setInvLoading(false);
      }
    },
    [canAccessWarehouse, accessToken, productId, variantId, variant]
  );

  useEffect(() => {
    if (!canAccessWarehouse || !variant || !accessToken) return;
    void loadInventory();
  }, [canAccessWarehouse, variant?.id, accessToken, loadInventory]);

  const submitEditVariant = async () => {
    if (editSubmitting || !accessToken || !productId || !variantId) return;
    const sku = editForm.sku.trim();
    const variantName = editForm.variantName.trim();
    if (!sku || !variantName) {
      setEditError("Nhập SKU và tên biến thể.");
      return;
    }
    if (sku.length > SKU_MAX || variantName.length > VARIANT_NAME_MAX) {
      setEditError(`SKU tối đa ${SKU_MAX} ký tự; tên biến thể tối đa ${VARIANT_NAME_MAX}.`);
      return;
    }
    const rp = Number(editForm.retailPrice);
    const cp = Number(editForm.costPrice);
    if (!Number.isFinite(rp) || rp < 0 || !Number.isFinite(cp) || cp < 0) {
      setEditError("Giá bán và giá vốn phải là số không âm.");
      return;
    }
    const dim = editForm.dimensions.trim();
    if (dim.length > DIM_MAX) {
      setEditError(`Kích thước tối đa ${DIM_MAX} ký tự.`);
      return;
    }
    let imageUrl = editForm.imageUrl.trim();
    if (imageUrl.length > IMG_URL_MAX) {
      setEditError(`URL ảnh tối đa ${IMG_URL_MAX} ký tự.`);
      return;
    }
    setEditSubmitting(true);
    setEditError("");
    try {
      if (editImageFile) {
        const uploadData = await uploadAdminFile(accessToken, editImageFile, "product");
        const u = typeof uploadData?.secureUrl === "string" ? uploadData.secureUrl.trim() : "";
        if (!u) throw new Error("Upload ảnh thất bại.");
        imageUrl = u;
      }
      /** @type {import("@/services/admin/adminProductsApi").AdminProductVariantCreatePayload} */
      const payload = {
        sku,
        variantName,
        retailPrice: rp,
        costPrice: cp,
      };
      const wTrim = editForm.weight.trim();
      if (wTrim) {
        const w = Number(wTrim);
        if (Number.isFinite(w) && w >= 0) payload.weight = w;
      }
      if (dim) payload.dimensions = dim;
      if (imageUrl) payload.imageUrl = imageUrl;
      const updated = await updateAdminProductVariant(accessToken, productId, variantId, payload);
      setVariant((prev) => (prev ? { ...prev, ...updated } : updated));
      setEditImageFile(null);
      if (canAccessWarehouse) await loadInventory(updated);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không lưu được biến thể.";
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  const submitInventory = async () => {
    if (invSubmitting || !canAccessWarehouse || !accessToken || !productId || !variantId) return;
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
      await upsertAdminProductVariantInventory(accessToken, productId, variantId, {
        warehouseLocation: loc || undefined,
        quantityOnHand: oh,
        quantityReserved: rs,
      });
      setInvHasRecord(true);
      const v = await loadVariant({ silent: true });
      await loadInventory(v ?? undefined);
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

  const confirmDeleteVariant = async () => {
    if (deleteSubmitting || !accessToken || !productId || !variantId) return;
    setDeleteSubmitting(true);
    setDeleteError("");
    try {
      await deleteAdminProductVariant(accessToken, productId, variantId);
      setDeleteOpen(false);
      navigate(`${PRODUCTS_LIST_PATH}/${encodeURIComponent(productId)}`);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không xóa được biến thể.";
      setDeleteError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const loadTransactions = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !variantId) {
      setTxLoading(false);
      return;
    }
    setTxLoading(true);
    setTxError("");
    try {
      const result = await fetchAdminInventoryTransactions(accessToken, {
        page: txPage,
        pageSize: txPageSize,
        variantId,
        type: "",
        fromDate: "",
        toDate: "",
      });
      setTxData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được lịch sử kho.";
      setTxError(msg);
      setTxData(null);
    } finally {
      setTxLoading(false);
    }
  }, [accessToken, isAuthenticated, txPage, txPageSize, variantId]);

  useEffect(() => {
    setTxPage(1);
  }, [variantId, txPageSize]);

  useEffect(() => {
    if (detailTab !== "history" || !variant) return;
    void loadTransactions();
  }, [detailTab, variant, loadTransactions]);

  const txTotal = txData?.totalCount ?? 0;
  const txTotalPages = Math.max(1, Math.ceil(txTotal / txPageSize) || 1);
  const txItems = txData?.items ?? [];

  const pidForLinks = variant?.productId != null ? String(variant.productId) : productId;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link
          to="/admin"
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="px-1.5 py-0.5 text-slate-400 dark:text-slate-500">Sản phẩm</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={VARIANTS_LIST_PATH}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Danh sách biến thể
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={`${PRODUCTS_LIST_PATH}/${encodeURIComponent(pidForLinks)}`}
          className="max-w-[min(100%,12rem)] truncate rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {variant?.productName ?? `Sản phẩm #${pidForLinks}`}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="max-w-[min(100%,14rem)] truncate px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
          {variant?.sku ?? variant?.variantName ?? `Biến thể #${variantId}`}
        </span>
      </nav>

      {loading && !variant ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600/70" aria-hidden />
          <span className="text-sm font-medium">Đang tải biến thể…</span>
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && variant ? (
        <>
          <Dialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open) setDeleteError("");
            }}
          >
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => deleteSubmitting && e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Xóa biến thể</DialogTitle>
                <DialogDescription>
                  SKU <span className="font-mono font-semibold text-foreground">{variant.sku}</span> sẽ bị xóa. Nếu biến thể đã dùng trong đơn hoặc báo giá, máy chủ sẽ từ chối và bạn có thể đọc thông báo lỗi bên dưới.
                </DialogDescription>
              </DialogHeader>
              {deleteError ? (
                <p
                  className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                >
                  {deleteError}
                </p>
              ) : null}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" disabled={deleteSubmitting} onClick={() => setDeleteOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-1.5"
                  disabled={deleteSubmitting}
                  onClick={() => void confirmDeleteVariant()}
                >
                  {deleteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
                  Xóa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <header className="border-b border-slate-200/90 pb-6 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Chi tiết biến thể
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{variant.variantName}</h1>
                <p className="font-mono text-sm text-slate-600 dark:text-slate-400">{variant.sku}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sản phẩm:{" "}
                  <Link
                    to={`${PRODUCTS_LIST_PATH}/${encodeURIComponent(pidForLinks)}`}
                    className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                  >
                    {variant.productName ?? "—"}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-slate-500">#{pidForLinks}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  ID biến thể #{variant.id}
                </span>
                <Button type="button" variant="outline" size="sm" className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Xóa
                </Button>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-1" role="tablist" aria-label="Phần nội dung chi tiết biến thể">
              <button
                type="button"
                role="tab"
                aria-selected={detailTab === "info"}
                className={cn(
                  "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                  detailTab === "info"
                    ? "border-teal-600 text-teal-800 dark:border-teal-500 dark:text-teal-300"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => setDetailTab("info")}
              >
                Thông tin
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={detailTab === "history"}
                className={cn(
                  "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                  detailTab === "history"
                    ? "border-teal-600 text-teal-800 dark:border-teal-500 dark:text-teal-300"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => setDetailTab("history")}
              >
                Lịch sử xuất nhập kho
              </button>
            </div>
          </div>

          <div role="tabpanel" hidden={detailTab !== "info"} className="space-y-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-2">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base">Hình ảnh & giá</CardTitle>
                  <CardDescription>Ảnh biến thể và giá bán / giá vốn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-5 sm:p-6">
                  <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
                    {variant.imageUrl ? (
                      <img
                        src={variant.imageUrl}
                        alt=""
                        className="max-h-[min(20rem,45vh)] w-full object-contain object-center"
                        loading="eager"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] max-h-72 flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                        <ImageIcon className="h-12 w-12 opacity-50" strokeWidth={1.5} aria-hidden />
                        <span className="text-sm font-medium">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Giá bán</dt>
                      <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                        {formatMoneyVnd(variant.retailPrice)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Giá vốn</dt>
                      <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        {formatMoneyVnd(variant.costPrice)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base">Tồn kho</CardTitle>
                  <CardDescription>
                    {canAccessWarehouse
                      ? "Cập nhật tồn kho theo biến thể. Khả dụng = tồn thực tế − đang giữ."
                      : "Số liệu tổng hợp trên biến thể. Chỉnh sửa tồn dành cho tài khoản có quyền kho."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Tồn thực tế</dt>
                      <dd className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {variant.quantityOnHand ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Đang giữ</dt>
                      <dd className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {variant.quantityReserved ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <dt className="font-medium text-slate-700 dark:text-slate-300">Khả dụng</dt>
                      <dd className="font-mono text-lg font-bold tabular-nums text-teal-700 dark:text-teal-400">
                        {variant.quantityAvailable ?? "—"}
                      </dd>
                    </div>
                    {canAccessWarehouse && invHasRecord && invPolicy && !invLoading ? (
                      <>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500 dark:text-slate-400">Điểm đặt hàng lại</dt>
                          <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                            {invPolicy.reorderPoint != null ? invPolicy.reorderPoint : "—"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500 dark:text-slate-400">Tồn an toàn</dt>
                          <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                            {invPolicy.safetyStock != null ? invPolicy.safetyStock : "—"}
                          </dd>
                        </div>
                      </>
                    ) : null}
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Cân nặng</dt>
                      <dd className="font-mono text-slate-800 dark:text-slate-200">{variant.weight != null ? variant.weight : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Kích thước</dt>
                      <dd className="text-right text-slate-800 dark:text-slate-200">{variant.dimensions?.trim() || "—"}</dd>
                    </div>
                  </dl>

                  {canAccessWarehouse ? (
                    <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nhập tồn nhanh (PUT)</p>
                      {invLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Đang tải bản ghi tồn…
                        </div>
                      ) : null}
                      {invError ? (
                        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                          {invError}
                        </p>
                      ) : null}
                      {!invLoading && !invError ? (
                        <>
                          {!invHasRecord ? (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Chưa có bản ghi tồn — nhập bên dưới và lưu để tạo mới.
                            </p>
                          ) : null}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="inv-loc">
                              Vị trí kho
                            </label>
                            <input
                              id="inv-loc"
                              type="text"
                              maxLength={WH_LOC_MAX}
                              className={fieldInput}
                              placeholder="VD. KHO-A-RACK-12"
                              value={invForm.warehouseLocation}
                              onChange={(e) => setInvForm((f) => ({ ...f, warehouseLocation: e.target.value }))}
                              disabled={invSubmitting}
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="inv-oh">
                                Tồn thực tế <span className="text-red-600">*</span>
                              </label>
                              <input
                                id="inv-oh"
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                className={fieldInput}
                                value={invForm.quantityOnHand}
                                onChange={(e) => setInvForm((f) => ({ ...f, quantityOnHand: e.target.value }))}
                                disabled={invSubmitting}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="inv-rs">
                                Đang giữ <span className="text-red-600">*</span>
                              </label>
                              <input
                                id="inv-rs"
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                className={fieldInput}
                                value={invForm.quantityReserved}
                                onChange={(e) => setInvForm((f) => ({ ...f, quantityReserved: e.target.value }))}
                                disabled={invSubmitting}
                              />
                            </div>
                          </div>
                          {(() => {
                            const oh = Number(invForm.quantityOnHand);
                            const rs = Number(invForm.quantityReserved);
                            const av = Number.isFinite(oh) && Number.isFinite(rs) ? oh - rs : NaN;
                            return Number.isFinite(av) ? (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Khả dụng (ước tính form):{" "}
                                <span className="font-mono font-semibold text-teal-700 dark:text-teal-400">{av.toLocaleString("vi-VN")}</span>
                              </p>
                            ) : null;
                          })()}
                          {invSaveError ? (
                            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                              {invSaveError}
                            </p>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            className="w-full gap-1.5 sm:w-auto"
                            disabled={invSubmitting || invLoading}
                            onClick={() => void submitInventory()}
                          >
                            {invSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                            Lưu tồn kho
                          </Button>
                          <VariantInventoryReorderPolicy
                            accessToken={accessToken}
                            productId={productId}
                            variantId={variantId}
                            enabled={invHasRecord}
                            reorderPoint={invPolicy?.reorderPoint}
                            safetyStock={invPolicy?.safetyStock}
                            onSaved={(data) => {
                              const o = /** @type {Record<string, unknown>} */ (data);
                              setInvPolicy({
                                reorderPoint: pickNullableNumber(o, "reorderPoint", "ReorderPoint"),
                                safetyStock: pickNullableNumber(o, "safetyStock", "SafetyStock"),
                              });
                              void loadVariant({ silent: true });
                            }}
                          />
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base">Chỉnh sửa biến thể</CardTitle>
                <CardDescription>SKU, tên, giá và kích thước biến thể.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-sku">
                      SKU <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="edit-sku"
                      type="text"
                      maxLength={SKU_MAX}
                      className={fieldInput}
                      value={editForm.sku}
                      onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))}
                      disabled={editSubmitting}
                    />
                    <p className="text-[11px] text-slate-500">{editForm.sku.length}/{SKU_MAX}</p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-name">
                      Tên biến thể <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      maxLength={VARIANT_NAME_MAX}
                      className={fieldInput}
                      value={editForm.variantName}
                      onChange={(e) => setEditForm((f) => ({ ...f, variantName: e.target.value }))}
                      disabled={editSubmitting}
                    />
                    <p className="text-[11px] text-slate-500">{editForm.variantName.length}/{VARIANT_NAME_MAX}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-rp">
                      Giá bán (đ) <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="edit-rp"
                      type="number"
                      min={0}
                      step={1}
                      className={fieldInput}
                      value={editForm.retailPrice}
                      onChange={(e) => setEditForm((f) => ({ ...f, retailPrice: e.target.value }))}
                      disabled={editSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-cp">
                      Giá vốn (đ) <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="edit-cp"
                      type="number"
                      min={0}
                      step={1}
                      className={fieldInput}
                      value={editForm.costPrice}
                      onChange={(e) => setEditForm((f) => ({ ...f, costPrice: e.target.value }))}
                      disabled={editSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-w">
                      Cân nặng
                    </label>
                    <input
                      id="edit-w"
                      type="text"
                      className={fieldInput}
                      placeholder="VD. 1.6"
                      value={editForm.weight}
                      onChange={(e) => setEditForm((f) => ({ ...f, weight: e.target.value }))}
                      disabled={editSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-dim">
                      Kích thước
                    </label>
                    <input
                      id="edit-dim"
                      type="text"
                      maxLength={DIM_MAX}
                      className={fieldInput}
                      value={editForm.dimensions}
                      onChange={(e) => setEditForm((f) => ({ ...f, dimensions: e.target.value }))}
                      disabled={editSubmitting}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-img-url">
                      URL ảnh
                    </label>
                    <input
                      id="edit-img-url"
                      type="url"
                      maxLength={IMG_URL_MAX}
                      className={fieldInput}
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      disabled={editSubmitting}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-img-file">
                      Hoặc tải ảnh mới
                    </label>
                    <input
                      id="edit-img-file"
                      type="file"
                      accept="image/*"
                      className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700 dark:text-slate-400"
                      disabled={editSubmitting}
                      onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
                {editError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200" role="alert">
                    {editError}
                  </p>
                ) : null}
                <Button type="button" className="gap-1.5" disabled={editSubmitting} onClick={() => void submitEditVariant()}>
                  {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                  Lưu biến thể
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Link
                to={VARIANTS_LIST_PATH}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition-transform active:scale-[0.98] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                ← Danh sách biến thể
              </Link>
              <Link
                to={`${PRODUCTS_LIST_PATH}/${encodeURIComponent(pidForLinks)}`}
                className="inline-flex items-center justify-center rounded-lg border border-teal-200 bg-teal-50/80 px-4 py-2 text-sm font-medium text-teal-900 shadow-sm transition-transform active:scale-[0.98] hover:bg-teal-100/80 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-900/50"
              >
                Mở trang sản phẩm
              </Link>
            </div>
          </div>

          <div role="tabpanel" hidden={detailTab !== "history"} className="space-y-4">
            {txError ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
                role="alert"
              >
                {txError}
              </div>
            ) : null}

            <Card className="overflow-hidden border-slate-200/80 shadow-md dark:border-slate-800 dark:shadow-none">
              <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight">Giao dịch kho</CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm">
                    {txLoading ? "Đang tải…" : `${txTotal.toLocaleString("vi-VN")} bản ghi`} —{" "}
                     lọc theo biến thể này.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900/50">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Hiển thị</span>
                    <select
                      value={txPageSize}
                      onChange={(e) => setTxPageSize(Number(e.target.value))}
                      className="h-7 cursor-pointer rounded-md border-0 bg-transparent pr-6 text-sm font-semibold text-foreground focus:ring-0"
                    >
                      {TX_PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n} / trang
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                    Trang{" "}
                    <span className="font-mono tabular-nums text-foreground">
                      {txPage} / {txTotalPages}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                        <th className="px-4 py-3.5 pl-6 font-mono">ID</th>
                        <th className="px-4 py-3.5">Loại</th>
                        <th className="px-4 py-3.5 text-right">Số lượng</th>
                        <th className="px-4 py-3.5">Tham chiếu</th>
                        <th className="px-4 py-3.5 pr-6">Thời điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {txLoading && txItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                              <Loader2 className="h-8 w-8 animate-spin text-slate-600/70" aria-hidden />
                              <span className="text-sm font-medium">Đang tải lịch sử…</span>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      {!txLoading && txItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Chưa có giao dịch kho</p>
                            <p className="mt-1 text-xs text-slate-500">Biến thể này chưa ghi nhận xuất nhập.</p>
                          </td>
                        </tr>
                      ) : null}
                      {txItems.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={cn(
                            "transition-colors hover:bg-slate-500/[0.04] dark:hover:bg-slate-500/[0.06]",
                            idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                          )}
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {row.id}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                inventoryTransactionTypeBadgeClass(row.transactionType)
                              )}
                            >
                              {labelInventoryTransactionType(row.transactionType)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 align-middle text-right font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {Number(row.quantity).toLocaleString("vi-VN")}
                          </td>
                          <td className="max-w-[200px] px-4 py-3.5 align-middle text-sm text-slate-800 dark:text-slate-200">
                            {row.referenceType ? (
                              <span
                                className={cn(
                                  "inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  inventoryReferenceTypeBadgeClass(row.referenceType)
                                )}
                                title={row.referenceType}
                              >
                                {labelInventoryReferenceType(row.referenceType)}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                            <div className="mt-1 truncate font-mono text-xs text-slate-600 dark:text-slate-400" title={row.referenceId}>
                              {row.referenceId || "—"}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 pr-6 align-middle text-xs text-slate-600 dark:text-slate-400">
                            {formatDateTime(row.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {txTotal > 0 ? (
                      <>
                        Hiển thị{" "}
                        <span className="font-mono font-medium tabular-nums text-slate-700 dark:text-slate-200">
                          {(txPage - 1) * txPageSize + 1}–{Math.min(txPage * txPageSize, txTotal)}
                        </span>{" "}
                        / {txTotal.toLocaleString("vi-VN")} giao dịch
                      </>
                    ) : (
                      "Không có bản ghi."
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1"
                      disabled={txLoading || txPage <= 1}
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <span className="min-w-[5rem] text-center font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                      {txPage} / {txTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1"
                      disabled={txLoading || txPage >= txTotalPages}
                      onClick={() => setTxPage((p) => p + 1)}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
