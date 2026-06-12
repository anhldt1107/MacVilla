import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminCategoryTree, flattenCategoryTreeForSelect } from "@/services/admin/adminCategoriesApi";
import {
  ADMIN_PRODUCT_STATUS_OPTIONS,
  adminProductStatusBadgeClass,
  bulkUpsertAdminProductAttributes,
  createAdminProductVariant,
  deleteAdminProductAttribute,
  fetchAdminProductDetail,
  labelAdminProductStatus,
  updateAdminProduct,
  updateAdminProductVariant,
} from "@/services/admin/adminProductsApi";
import { uploadAdminFile } from "@/services/admin/adminUploadsApi";
import {
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Layers,
  Loader2,
  Minus,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { suggestSlugFromName } from "@/lib/slug";
import { cn } from "@/lib/utils";

const PRODUCTS_LIST_PATH = "/admin/products";

/** Trạng thái tạo/sửa SP (bỏ mục «Tất cả» trong `ADMIN_PRODUCT_STATUS_OPTIONS`). */
const ADMIN_PRODUCT_CREATE_STATUS_OPTIONS = ADMIN_PRODUCT_STATUS_OPTIONS.filter((o) => o.value);

const fieldSelect = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "cursor-pointer appearance-none bg-transparent pr-10",
  "hover:border-slate-300 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function newUpsertRowKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {import("@/services/admin/adminProductsApi").AdminProductAttributeGroup[] | undefined} attrs
 */
function buildUpsertFormRows(attrs) {
  if (!attrs?.length) {
    return [{ key: newUpsertRowKey(), name: "", values: [""] }];
  }
  return attrs.map((a) => ({
    key: `existing-${a.id}`,
    name: a.name,
    values: a.values?.length ? a.values.map((v) => v.value) : [""],
  }));
}

/**
 * @param {{ key: string; name: string; values: string[] }[]} rows
 * @returns {Record<string, string[]>}
 */
function upsertRowsToPayload(rows) {
  /** @type {Record<string, string[]>} */
  const body = {};
  for (const row of rows) {
    const n = row.name.trim();
    if (!n) continue;
    const vals = row.values.map((v) => v.trim()).filter(Boolean);
    if (!vals.length) continue;
    if (!body[n]) body[n] = [];
    for (const v of vals) {
      if (!body[n].includes(v)) body[n].push(v);
    }
  }
  return body;
}

const upsertFieldClass = cn(
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-teal-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-pulse" aria-hidden>
      <div className="h-4 w-2/3 max-w-lg rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-10 w-full max-w-2xl rounded-lg bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2">
          <div className="aspect-[16/10] max-h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
          <div className="h-24 rounded-2xl bg-slate-200/60 dark:bg-slate-800/70" />
          <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-800/70" />
        </div>
        <div className="space-y-4">
          <div className="h-52 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        </div>
      </div>
    </div>
  );
}

/**
 * Bảng biến thể & tồn kho (tab riêng trên trang chi tiết).
 * @param {{
 *   variants: import("@/services/admin/adminProductsApi").AdminProductVariantDetail[];
 *   headerActions?: import("react").ReactNode;
 *   onEditVariant?: (v: import("@/services/admin/adminProductsApi").AdminProductVariantDetail) => void;
 * }} props
 */
function VariantsStockCard({ variants, headerActions, onEditVariant }) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800 dark:shadow-none">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300">
              <Layers className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">Biến thể & tồn kho</CardTitle>
              <CardDescription className="text-xs">{variants.length} biến thể</CardDescription>
            </div>
          </div>
          {headerActions ? <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {variants.length === 0 ? (
          <p className="p-5 text-sm text-slate-500 sm:p-6 dark:text-slate-400">Chưa có biến thể.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="w-14 py-3 pl-5">Ảnh</th>
                  <th className="px-3 py-3">SKU / tên</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right font-mono">Giá bán</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right font-mono">Giá vốn</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center font-mono">Tồn</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center font-mono">Giữ</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center font-mono">Khả dụng</th>
                  {onEditVariant ? (
                    <th className="w-14 whitespace-nowrap py-3 pr-5 text-center font-mono">Sửa</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {variants.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                    <td className="py-3 pl-5 align-middle">
                      {v.imageUrl ? (
                        <img
                          src={v.imageUrl}
                          alt=""
                          className="h-11 w-11 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                          <ImageIcon className="h-4 w-4 text-slate-400" aria-hidden />
                        </span>
                      )}
                    </td>
                    <td className="max-w-[220px] px-3 py-3 align-middle">
                      <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{v.sku}</div>
                      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{v.variantName}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-slate-400">
                        {v.weight != null ? <span>{String(v.weight)}</span> : null}
                        {v.dimensions ? <span>{v.dimensions}</span> : null}
                        <span>#{v.id}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right align-middle font-mono text-sm font-semibold tabular-nums">
                      {formatMoneyVnd(v.retailPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right align-middle font-mono text-sm tabular-nums text-slate-700 dark:text-slate-300">
                      {formatMoneyVnd(v.costPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center align-middle font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {v.quantityOnHand ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center align-middle font-mono text-xs tabular-nums text-amber-800 dark:text-amber-200">
                      {v.quantityReserved ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center align-middle font-mono text-xs font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                      {v.quantityAvailable ?? "—"}
                    </td>
                    {onEditVariant ? (
                      <td className="py-3 pr-5 text-center align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-500 hover:bg-teal-500/10 hover:text-teal-800 dark:text-slate-400 dark:hover:text-teal-300"
                          title="Chỉnh sửa biến thể"
                          aria-label={`Chỉnh sửa biến thể ${v.sku}`}
                          onClick={() => onEditVariant(v)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Trang chi tiết sản phẩm (admin) — GET /api/admin/products/:id
 */
export function AdminProductDetailPage() {
  const { id } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(
    /** @type {import("@/services/admin/adminProductsApi").AdminProductDetail | null} */ (null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attributePendingDelete, setAttributePendingDelete] = useState(
    /** @type {{ id: number; name: string } | null} */ (null)
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [upsertDialogOpen, setUpsertDialogOpen] = useState(false);
  const [upsertRows, setUpsertRows] = useState(
    /** @type {{ key: string; name: string; values: string[] }[]} */ ([{ key: newUpsertRowKey(), name: "", values: [""] }])
  );
  const [upsertSubmitting, setUpsertSubmitting] = useState(false);
  const [upsertError, setUpsertError] = useState("");
  const [detailTab, setDetailTab] = useState(/** @type {"overview" | "variants"} */ ("overview"));

  const [categoryTree, setCategoryTree] = useState(
    /** @type {import("@/services/admin/adminCategoriesApi").AdminCategoryTreeNode[]} */ ([])
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const categoryOptions = useMemo(() => flattenCategoryTreeForSelect(categoryTree), [categoryTree]);

  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProductSubmitting, setEditProductSubmitting] = useState(false);
  const [editProductError, setEditProductError] = useState("");
  const [editProductForm, setEditProductForm] = useState({
    categoryId: "",
    name: "",
    slug: "",
    description: "",
    basePrice: "",
    warrantyPeriodMonths: "",
    status: "Active",
  });
  const [editProductImageFile, setEditProductImageFile] = useState(/** @type {File | null} */ (null));
  const [editProductRemoveImage, setEditProductRemoveImage] = useState(false);
  const editProductFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const resetEditProductImageInputs = useCallback(() => {
    setEditProductImageFile(null);
    setEditProductRemoveImage(false);
    const el = editProductFileInputRef.current;
    if (el) el.value = "";
  }, []);

  const openEditProductDialog = useCallback(() => {
    if (!product) return;
    setEditProductError("");
    setEditProductForm({
      categoryId: String(product.categoryId ?? ""),
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      basePrice:
        product.basePrice != null && Number.isFinite(Number(product.basePrice))
          ? String(product.basePrice)
          : "",
      warrantyPeriodMonths:
        product.warrantyPeriodMonths != null && Number.isFinite(Number(product.warrantyPeriodMonths))
          ? String(product.warrantyPeriodMonths)
          : "",
      status: product.status || "Active",
    });
    resetEditProductImageInputs();
    setEditProductOpen(true);
  }, [product, resetEditProductImageInputs]);

  const [createVariantOpen, setCreateVariantOpen] = useState(false);
  const [createVariantSubmitting, setCreateVariantSubmitting] = useState(false);
  const [createVariantError, setCreateVariantError] = useState("");
  const [variantForm, setVariantForm] = useState({
    sku: "",
    variantName: "",
    retailPrice: "",
    costPrice: "",
    weight: "",
    dimensions: "",
  });
  const [variantImageFile, setVariantImageFile] = useState(/** @type {File | null} */ (null));
  const variantFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const resetCreateVariantForm = useCallback(() => {
    setVariantForm({
      sku: "",
      variantName: "",
      retailPrice: "",
      costPrice: "",
      weight: "",
      dimensions: "",
    });
    setVariantImageFile(null);
    const el = variantFileInputRef.current;
    if (el) el.value = "";
  }, []);

  const openCreateVariantDialog = useCallback(() => {
    setCreateVariantError("");
    resetCreateVariantForm();
    setCreateVariantOpen(true);
  }, [resetCreateVariantForm]);

  const [editVariantOpen, setEditVariantOpen] = useState(false);
  const [editVariantId, setEditVariantId] = useState(/** @type {number | null} */ (null));
  const [editVariantSubmitting, setEditVariantSubmitting] = useState(false);
  const [editVariantError, setEditVariantError] = useState("");
  const [editVariantForm, setEditVariantForm] = useState({
    sku: "",
    variantName: "",
    retailPrice: "",
    costPrice: "",
    weight: "",
    dimensions: "",
  });
  const [editVariantImageFile, setEditVariantImageFile] = useState(/** @type {File | null} */ (null));
  const [editVariantImageUrlCurrent, setEditVariantImageUrlCurrent] = useState("");
  const editVariantFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const resetEditVariantForm = useCallback(() => {
    setEditVariantId(null);
    setEditVariantForm({
      sku: "",
      variantName: "",
      retailPrice: "",
      costPrice: "",
      weight: "",
      dimensions: "",
    });
    setEditVariantImageUrlCurrent("");
    setEditVariantImageFile(null);
    const el = editVariantFileInputRef.current;
    if (el) el.value = "";
  }, []);

  const openEditVariantDialog = useCallback(
    /** @param {import("@/services/admin/adminProductsApi").AdminProductVariantDetail} v */
    (v) => {
      setEditVariantError("");
      setEditVariantId(v.id);
      setEditVariantForm({
        sku: v.sku ?? "",
        variantName: v.variantName ?? "",
        retailPrice: v.retailPrice != null && Number.isFinite(Number(v.retailPrice)) ? String(v.retailPrice) : "",
        costPrice: v.costPrice != null && Number.isFinite(Number(v.costPrice)) ? String(v.costPrice) : "",
        weight: v.weight != null && Number.isFinite(Number(v.weight)) ? String(v.weight) : "",
        dimensions: v.dimensions != null ? String(v.dimensions) : "",
      });
      setEditVariantImageUrlCurrent((v.imageUrl || "").trim());
      setEditVariantImageFile(null);
      const el = editVariantFileInputRef.current;
      if (el) el.value = "";
      setEditVariantOpen(true);
    },
    []
  );

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminProductDetail(accessToken, id);
      setProduct(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết sản phẩm.";
      setError(msg);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setCategoriesLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setCategoriesLoading(true);
      try {
        const t = await fetchAdminCategoryTree(accessToken);
        if (!cancelled) setCategoryTree(Array.isArray(t) ? t : []);
      } catch {
        if (!cancelled) setCategoryTree([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  const openDeleteAttributeDialog = (attr) => {
    setDeleteError("");
    setAttributePendingDelete({ id: attr.id, name: attr.name });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAttribute = async () => {
    if (!accessToken || !id || !attributePendingDelete) return;
    const pendingId = attributePendingDelete.id;
    setDeleteSubmitting(true);
    setDeleteError("");
    try {
      await deleteAdminProductAttribute(accessToken, id, pendingId);
      setProduct((prev) => {
        if (!prev) return prev;
        const nextAttrs = (prev.attributes ?? []).filter((a) => a.id !== pendingId);
        return {
          ...prev,
          attributes: nextAttrs,
          attributeCount: nextAttrs.length,
        };
      });
      setDeleteDialogOpen(false);
      setAttributePendingDelete(null);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không xóa được thuộc tính.";
      setDeleteError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openUpsertAttributesDialog = useCallback(() => {
    if (!product) return;
    setUpsertError("");
    setUpsertRows(buildUpsertFormRows(product.attributes));
    setUpsertDialogOpen(true);
  }, [product]);

  const submitUpsertAttributes = async () => {
    if (!accessToken || !id) return;
    const body = upsertRowsToPayload(upsertRows);
    if (Object.keys(body).length === 0) {
      setUpsertError("Thêm ít nhất một thuộc tính có tên và ít nhất một giá trị không rỗng.");
      return;
    }
    setUpsertSubmitting(true);
    setUpsertError("");
    try {
      const data = await bulkUpsertAdminProductAttributes(accessToken, id, body);
      const list = Array.isArray(data) ? data : [];
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              attributes: list,
              attributeCount: list.length,
            }
          : prev
      );
      setUpsertDialogOpen(false);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không lưu được thuộc tính.";
      setUpsertError(msg);
    } finally {
      setUpsertSubmitting(false);
    }
  };

  const submitCreateVariant = async () => {
    if (!accessToken || !id) return;
    const { sku, variantName, retailPrice, costPrice, weight, dimensions } = variantForm;
    if (!sku.trim() || !variantName.trim()) {
      setCreateVariantError("Nhập SKU và tên biến thể.");
      return;
    }
    const rp = Number(retailPrice);
    const cp = Number(costPrice);
    if (!Number.isFinite(rp) || rp < 0 || !Number.isFinite(cp) || cp < 0) {
      setCreateVariantError("Giá bán và giá vốn phải là số không âm.");
      return;
    }
    setCreateVariantSubmitting(true);
    setCreateVariantError("");
    try {
      let imageUrl = "";
      if (variantImageFile) {
        const uploadData = await uploadAdminFile(accessToken, variantImageFile, "product");
        imageUrl = typeof uploadData?.secureUrl === "string" ? uploadData.secureUrl.trim() : "";
        if (!imageUrl) throw new Error("Upload ảnh thất bại.");
      }

      /** @type {import("@/services/admin/adminProductsApi").AdminProductVariantCreatePayload} */
      const payload = {
        sku: sku.trim(),
        variantName: variantName.trim(),
        retailPrice: rp,
        costPrice: cp,
      };
      const wTrim = weight.trim();
      if (wTrim) {
        const w = Number(wTrim);
        if (Number.isFinite(w)) payload.weight = w;
      }
      if (dimensions.trim()) payload.dimensions = dimensions.trim();
      if (imageUrl) payload.imageUrl = imageUrl;

      const created = await createAdminProductVariant(accessToken, id, payload);
      setProduct((prev) => {
        if (!prev) return prev;
        const list = [...(prev.variants ?? []), created];
        return { ...prev, variants: list, variantCount: list.length };
      });
      setCreateVariantOpen(false);
      resetCreateVariantForm();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tạo được biến thể.";
      setCreateVariantError(msg);
    } finally {
      setCreateVariantSubmitting(false);
    }
  };

  const submitEditVariant = async () => {
    if (!accessToken || !id || editVariantId == null) return;
    const { sku, variantName, retailPrice, costPrice, weight, dimensions } = editVariantForm;
    if (!sku.trim() || !variantName.trim()) {
      setEditVariantError("Nhập SKU và tên biến thể.");
      return;
    }
    const rp = Number(retailPrice);
    const cp = Number(costPrice);
    if (!Number.isFinite(rp) || rp < 0 || !Number.isFinite(cp) || cp < 0) {
      setEditVariantError("Giá bán và giá vốn phải là số không âm.");
      return;
    }
    setEditVariantSubmitting(true);
    setEditVariantError("");
    try {
      let imageUrl = "";
      if (editVariantImageFile) {
        const uploadData = await uploadAdminFile(accessToken, editVariantImageFile, "product");
        imageUrl = typeof uploadData?.secureUrl === "string" ? uploadData.secureUrl.trim() : "";
        if (!imageUrl) throw new Error("Upload ảnh thất bại.");
      } else {
        imageUrl = editVariantImageUrlCurrent.trim();
      }

      /** @type {import("@/services/admin/adminProductsApi").AdminProductVariantCreatePayload} */
      const payload = {
        sku: sku.trim(),
        variantName: variantName.trim(),
        retailPrice: rp,
        costPrice: cp,
      };
      const wTrim = weight.trim();
      if (wTrim) {
        const w = Number(wTrim);
        if (Number.isFinite(w)) payload.weight = w;
      }
      if (dimensions.trim()) payload.dimensions = dimensions.trim();
      if (imageUrl) payload.imageUrl = imageUrl;

      const updated = await updateAdminProductVariant(accessToken, id, editVariantId, payload);
      setProduct((prev) => {
        if (!prev) return prev;
        const list = (prev.variants ?? []).map((x) => (x.id === updated.id ? { ...x, ...updated } : x));
        return { ...prev, variants: list };
      });
      setEditVariantOpen(false);
      resetEditVariantForm();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không cập nhật được biến thể.";
      setEditVariantError(msg);
    } finally {
      setEditVariantSubmitting(false);
    }
  };

  const submitEditProduct = async () => {
    if (!accessToken || !id || !product) return;
    if (!editProductForm.categoryId.trim()) {
      setEditProductError("Chọn danh mục.");
      return;
    }
    if (!editProductForm.name.trim() || !editProductForm.slug.trim()) {
      setEditProductError("Nhập tên và slug sản phẩm.");
      return;
    }
    const bp = Number(editProductForm.basePrice);
    if (!Number.isFinite(bp) || bp < 0) {
      setEditProductError("Giá cơ bản phải là số không âm.");
      return;
    }

    let wMonths = 0;
    const wTrim = editProductForm.warrantyPeriodMonths.trim();
    if (wTrim) {
      const w = Number(wTrim);
      if (!Number.isFinite(w) || w < 0 || !Number.isInteger(w) || w > 1200) {
        setEditProductError("Bảo hành phải là số nguyên từ 0 đến 1200 tháng.");
        return;
      }
      wMonths = w;
    }

    setEditProductSubmitting(true);
    setEditProductError("");
    try {
      /** @type {import("@/services/admin/adminProductsApi").AdminProductUpdatePayload} */
      const payload = {
        categoryId: Number(editProductForm.categoryId),
        name: editProductForm.name.trim(),
        slug: editProductForm.slug.trim(),
        description: editProductForm.description.trim() ? editProductForm.description.trim() : null,
        basePrice: bp,
        warrantyPeriodMonths: wMonths,
        status: editProductForm.status,
      };

      if (editProductRemoveImage) {
        payload.imageUrl = "";
      } else if (editProductImageFile) {
        const uploadData = await uploadAdminFile(accessToken, editProductImageFile, "product");
        const imageUrl = typeof uploadData?.secureUrl === "string" ? uploadData.secureUrl.trim() : "";
        if (!imageUrl) throw new Error("Upload ảnh thất bại.");
        payload.imageUrl = imageUrl;
      }

      const updated = await updateAdminProduct(accessToken, id, payload);
      setProduct(updated);
      setEditProductOpen(false);
      resetEditProductImageInputs();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không cập nhật được sản phẩm.";
      setEditProductError(msg);
    } finally {
      setEditProductSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="mx-auto max-w-7xl text-sm text-muted-foreground">Thiếu mã sản phẩm trong đường dẫn.</div>
    );
  }

  const attributes = product?.attributes ?? [];
  const variants = product?.variants ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setAttributePendingDelete(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => deleteSubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Xóa thuộc tính</DialogTitle>
            <DialogDescription>
              Thuộc tính{" "}
              <span className="font-semibold text-foreground">
                {attributePendingDelete?.name ? `«${attributePendingDelete.name}»` : ""}
              </span>{" "}
              sẽ bị gỡ khỏi sản phẩm. Thao tác không thể hoàn tác trên giao diện này.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200" role="alert">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteSubmitting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-1.5"
              disabled={deleteSubmitting}
              onClick={() => void confirmDeleteAttribute()}
            >
              {deleteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" aria-hidden />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={upsertDialogOpen}
        onOpenChange={(open) => {
          setUpsertDialogOpen(open);
          if (!open) setUpsertError("");
        }}
      >
        <DialogContent
          className="max-h-[min(90dvh,720px)] max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onPointerDownOutside={(e) => upsertSubmitting && e.preventDefault()}
        >
          <div className="max-h-[min(90dvh,720px)] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Thêm / cập nhật thuộc tính</DialogTitle>
              <DialogDescription>Mỗi dòng là một nhóm thuộc tính và các giá trị tương ứng.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {upsertRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-900/30"
                >
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor={`attr-name-${row.key}`}>
                        Tên thuộc tính
                      </label>
                      <input
                        id={`attr-name-${row.key}`}
                        type="text"
                        className={upsertFieldClass}
                        placeholder="Ví dụ: Chất liệu"
                        value={row.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUpsertRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, name: v } : r)));
                        }}
                        autoComplete="off"
                      />
                    </div>
                    {upsertRows.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-slate-500 hover:text-red-700 dark:hover:text-red-400"
                        onClick={() => setUpsertRows((prev) => prev.filter((r) => r.key !== row.key))}
                      >
                        Bỏ nhóm
                      </Button>
                    ) : null}
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Giá trị</p>
                  <ul className="space-y-2">
                    {row.values.map((val, vi) => (
                      <li key={`${row.key}-v-${vi}`} className="flex gap-2">
                        <input
                          type="text"
                          className={cn(upsertFieldClass, "flex-1")}
                          placeholder="Ví dụ: gốm"
                          value={val}
                          onChange={(e) => {
                            const t = e.target.value;
                            setUpsertRows((prev) =>
                              prev.map((r) => {
                                if (r.key !== row.key) return r;
                                const next = [...r.values];
                                next[vi] = t;
                                return { ...r, values: next };
                              })
                            );
                          }}
                          autoComplete="off"
                        />
                        {row.values.length > 1 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            aria-label="Xóa giá trị"
                            onClick={() =>
                              setUpsertRows((prev) =>
                                prev.map((r) => {
                                  if (r.key !== row.key) return r;
                                  const next = r.values.filter((_, j) => j !== vi);
                                  return { ...r, values: next.length ? next : [""] };
                                })
                              )
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1"
                    onClick={() =>
                      setUpsertRows((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, values: [...r.values, ""] } : r))
                      )
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm giá trị
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full gap-1 sm:w-auto"
                onClick={() => setUpsertRows((prev) => [...prev, { key: newUpsertRowKey(), name: "", values: [""] }])}
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm nhóm thuộc tính
              </Button>
            </div>
            {upsertError ? (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {upsertError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Button type="button" variant="outline" disabled={upsertSubmitting} onClick={() => setUpsertDialogOpen(false)}>
              Hủy
            </Button>
            <Button type="button" className="gap-1.5" disabled={upsertSubmitting} onClick={() => void submitUpsertAttributes()}>
              {upsertSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createVariantOpen}
        onOpenChange={(open) => {
          setCreateVariantOpen(open);
          if (!open) {
            setCreateVariantError("");
            resetCreateVariantForm();
          }
        }}
      >
        <DialogContent
          className="max-h-[min(90dvh,720px)] max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg"
          onPointerDownOutside={(e) => createVariantSubmitting && e.preventDefault()}
        >
          <div className="max-h-[min(90dvh,720px)] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Tạo biến thể</DialogTitle>
              <DialogDescription>Nhập SKU, giá và ảnh biến thể (nếu có).</DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="variant-sku">
                  SKU <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="variant-sku"
                  type="text"
                  className={upsertFieldClass}
                  placeholder="hang-hay-lam"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="variant-name">
                  Tên biến thể <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="variant-name"
                  type="text"
                  className={upsertFieldClass}
                  placeholder="Hàng Hay Lắm"
                  value={variantForm.variantName}
                  onChange={(e) => setVariantForm((f) => ({ ...f, variantName: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="variant-retail">
                  Giá bán (đ) <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="variant-retail"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className={upsertFieldClass}
                  placeholder="1000000"
                  value={variantForm.retailPrice}
                  onChange={(e) => setVariantForm((f) => ({ ...f, retailPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="variant-cost">
                  Giá vốn (đ) <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="variant-cost"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className={upsertFieldClass}
                  placeholder="200000"
                  value={variantForm.costPrice}
                  onChange={(e) => setVariantForm((f) => ({ ...f, costPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="variant-weight">
                  Trọng lượng (tùy chọn)
                </label>
                <input
                  id="variant-weight"
                  type="number"
                  min={0}
                  step="any"
                  className={upsertFieldClass}
                  placeholder="30"
                  value={variantForm.weight}
                  onChange={(e) => setVariantForm((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="variant-dimensions">
                  Kích thước (tùy chọn)
                </label>
                <input
                  id="variant-dimensions"
                  type="text"
                  className={upsertFieldClass}
                  placeholder="18x29"
                  value={variantForm.dimensions}
                  onChange={(e) => setVariantForm((f) => ({ ...f, dimensions: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="variant-image">
                  Ảnh biến thể (tùy chọn)
                </label>
                <input
                  ref={variantFileInputRef}
                  id="variant-image"
                  type="file"
                  accept="image/*"
                  className={cn(
                    "block w-full cursor-pointer rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:file:bg-teal-700"
                  )}
                  onChange={(e) => setVariantImageFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Chọn ảnh JPG/PNG (tùy chọn).</p>
              </div>
            </div>
            {createVariantError ? (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {createVariantError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Button type="button" variant="outline" disabled={createVariantSubmitting} onClick={() => setCreateVariantOpen(false)}>
              Hủy
            </Button>
            <Button type="button" className="gap-1.5" disabled={createVariantSubmitting} onClick={() => void submitCreateVariant()}>
              {createVariantSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
              Tạo biến thể
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editVariantOpen}
        onOpenChange={(open) => {
          setEditVariantOpen(open);
          if (!open) {
            setEditVariantError("");
            resetEditVariantForm();
          }
        }}
      >
        <DialogContent
          className="max-h-[min(90dvh,720px)] max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg"
          onPointerDownOutside={(e) => editVariantSubmitting && e.preventDefault()}
        >
          <div className="max-h-[min(90dvh,720px)] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa biến thể</DialogTitle>
              <DialogDescription>Giữ ảnh hiện tại nếu không chọn ảnh mới.</DialogDescription>
            </DialogHeader>
            {editVariantId != null ? (
              <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">Biến thể #{editVariantId}</p>
            ) : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="edit-variant-sku">
                  SKU <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="edit-variant-sku"
                  type="text"
                  className={upsertFieldClass}
                  value={editVariantForm.sku}
                  onChange={(e) => setEditVariantForm((f) => ({ ...f, sku: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="edit-variant-name">
                  Tên biến thể <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="edit-variant-name"
                  type="text"
                  className={upsertFieldClass}
                  value={editVariantForm.variantName}
                  onChange={(e) => setEditVariantForm((f) => ({ ...f, variantName: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="edit-variant-retail">
                  Giá bán (đ) <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="edit-variant-retail"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className={upsertFieldClass}
                  value={editVariantForm.retailPrice}
                  onChange={(e) => setEditVariantForm((f) => ({ ...f, retailPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="edit-variant-cost">
                  Giá vốn (đ) <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="edit-variant-cost"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className={upsertFieldClass}
                  value={editVariantForm.costPrice}
                  onChange={(e) => setEditVariantForm((f) => ({ ...f, costPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="edit-variant-weight">
                  Trọng lượng (tùy chọn)
                </label>
                <input
                  id="edit-variant-weight"
                  type="number"
                  min={0}
                  step="any"
                  className={upsertFieldClass}
                  value={editVariantForm.weight}
                  onChange={(e) => setEditVariantForm((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="edit-variant-dimensions">
                  Kích thước (tùy chọn)
                </label>
                <input
                  id="edit-variant-dimensions"
                  type="text"
                  className={upsertFieldClass}
                  value={editVariantForm.dimensions}
                  onChange={(e) => setEditVariantForm((f) => ({ ...f, dimensions: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="edit-variant-image">
                  Ảnh biến thể
                </label>
                {editVariantImageUrlCurrent && !editVariantImageFile ? (
                  <div className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200/90 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/30">
                    <img
                      src={editVariantImageUrlCurrent}
                      alt=""
                      className="h-14 w-14 rounded-md border border-slate-200 object-cover dark:border-slate-600"
                    />
                    <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">Ảnh hiện tại — chọn tệp mới để thay</p>
                  </div>
                ) : null}
                <input
                  ref={editVariantFileInputRef}
                  id="edit-variant-image"
                  type="file"
                  accept="image/*"
                  className={cn(
                    "block w-full cursor-pointer rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:file:bg-teal-700"
                  )}
                  onChange={(e) => setEditVariantImageFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Không chọn ảnh mới thì giữ ảnh hiện tại.</p>
              </div>
            </div>
            {editVariantError ? (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {editVariantError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Button type="button" variant="outline" disabled={editVariantSubmitting} onClick={() => setEditVariantOpen(false)}>
              Hủy
            </Button>
            <Button type="button" className="gap-1.5" disabled={editVariantSubmitting} onClick={() => void submitEditVariant()}>
              {editVariantSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
              Lưu biến thể
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editProductOpen}
        onOpenChange={(open) => {
          setEditProductOpen(open);
          if (!open) {
            setEditProductError("");
            resetEditProductImageInputs();
          }
        }}
      >
        <DialogContent
          className="grid max-h-[min(90dvh,calc(100vh-2rem))] min-h-0 w-[calc(100vw-1.5rem)] max-w-lg grid-rows-[minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:w-full sm:max-w-lg"
          onPointerDownOutside={(e) => editProductSubmitting && e.preventDefault()}
        >
          <div className="min-h-0 overflow-y-auto overscroll-contain p-6 pb-4">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
              <DialogDescription>Để giữ ảnh đại diện, không chọn ảnh mới. Chọn «Xóa ảnh» bên dưới nếu cần gỡ ảnh.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-category">
                  Danh mục <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="edit-prod-category"
                    value={editProductForm.categoryId}
                    disabled={categoriesLoading}
                    onChange={(e) => setEditProductForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className={cn(fieldSelect, categoriesLoading && "opacity-60")}
                  >
                    <option value="">Chọn danh mục</option>
                    {categoryOptions.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-name">
                  Tên sản phẩm <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="edit-prod-name"
                  type="text"
                  className={fieldInput}
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-slug">
                    Slug <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-teal-700 hover:bg-teal-500/10 dark:text-teal-300"
                    onClick={() => setEditProductForm((f) => ({ ...f, slug: suggestSlugFromName(f.name) }))}
                  >
                    Gợi ý từ tên
                  </Button>
                </div>
                <input
                  id="edit-prod-slug"
                  type="text"
                  className={fieldInput}
                  value={editProductForm.slug}
                  onChange={(e) => setEditProductForm((f) => ({ ...f, slug: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-desc">
                  Mô tả
                </label>
                <textarea
                  id="edit-prod-desc"
                  className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-price">
                    Giá cơ bản (đ) <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    id="edit-prod-price"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className={fieldInput}
                    value={editProductForm.basePrice}
                    onChange={(e) => setEditProductForm((f) => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-warranty">
                    Bảo hành (tháng)
                  </label>
                  <input
                    id="edit-prod-warranty"
                    type="number"
                    min={0}
                    max={1200}
                    step={1}
                    className={fieldInput}
                    placeholder="0"
                    value={editProductForm.warrantyPeriodMonths}
                    onChange={(e) => setEditProductForm((f) => ({ ...f, warrantyPeriodMonths: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-status">
                  Trạng thái <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="edit-prod-status"
                    value={editProductForm.status}
                    onChange={(e) => setEditProductForm((f) => ({ ...f, status: e.target.value }))}
                    className={fieldSelect}
                  >
                    {ADMIN_PRODUCT_CREATE_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-prod-image">
                  Ảnh đại diện (tùy chọn)
                </label>
                {product?.imageUrl?.trim() && !editProductImageFile ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200/90 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
                    {editProductRemoveImage ? (
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Đã đánh dấu xóa ảnh — lưu để gỡ ảnh đại diện.
                      </p>
                    ) : (
                      <>
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-700 hover:bg-red-500/10 dark:text-red-300"
                          onClick={() => {
                            setEditProductRemoveImage(true);
                            setEditProductImageFile(null);
                            const refEl = editProductFileInputRef.current;
                            if (refEl) refEl.value = "";
                          }}
                        >
                          Xóa ảnh
                        </Button>
                      </>
                    )}
                    {editProductRemoveImage && product.imageUrl ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditProductRemoveImage(false)}>
                        Hoàn tác
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                <input
                  ref={editProductFileInputRef}
                  id="edit-prod-image"
                  type="file"
                  accept="image/*"
                  className={cn(
                    "block w-full cursor-pointer rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:file:bg-teal-700"
                  )}
                  onChange={(e) => {
                    setEditProductRemoveImage(false);
                    setEditProductImageFile(e.target.files?.[0] ?? null);
                  }}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Không chọn ảnh mới và không xóa thì giữ ảnh hiện tại. Chọn tệp mới để thay ảnh đại diện.
                </p>
              </div>
            </div>
            {editProductError ? (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {editProductError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="relative z-10 shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <Button type="button" variant="outline" disabled={editProductSubmitting} onClick={() => setEditProductOpen(false)}>
              Hủy
            </Button>
            <Button type="button" className="gap-1.5" disabled={editProductSubmitting} onClick={() => void submitEditProduct()}>
              {editProductSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          to={PRODUCTS_LIST_PATH}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Danh sách
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="max-w-[min(100%,16rem)] truncate px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
          {product?.name ?? `ID ${id}`}
        </span>
      </nav>

      {loading && !product ? <DetailSkeleton /> : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && product ? (
        <>
          <header className="border-b border-slate-200/90 pb-8 dark:border-slate-800">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Chi tiết sản phẩm</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">{product.name}</h1>
                <p className="font-mono text-sm text-slate-600 dark:text-slate-400">{product.slug}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <span>Danh mục:</span>
                  <Link
                    to="/admin/product-categories"
                    className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                  >
                    {product.categoryName || "—"}
                  </Link>
                  <span className="font-mono text-xs text-slate-500">#{product.categoryId}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    adminProductStatusBadgeClass(product.status)
                  )}
                >
                  {labelAdminProductStatus(product.status)}
                </span>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-1" role="tablist" aria-label="Phần nội dung chi tiết sản phẩm">
              <button
                type="button"
                id="product-tab-overview"
                role="tab"
                aria-selected={detailTab === "overview"}
                aria-controls="product-detail-panel-overview"
                className={cn(
                  "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                  detailTab === "overview"
                    ? "border-teal-600 text-teal-800 dark:border-teal-500 dark:text-teal-300"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => setDetailTab("overview")}
              >
                Chi tiết
              </button>
              <button
                type="button"
                id="product-tab-variants"
                role="tab"
                aria-selected={detailTab === "variants"}
                aria-controls="product-detail-panel-variants"
                className={cn(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                  detailTab === "variants"
                    ? "border-teal-600 text-teal-800 dark:border-teal-500 dark:text-teal-300"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                onClick={() => setDetailTab("variants")}
              >
                Biến thể & tồn kho
                <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 font-mono text-xs tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {variants.length}
                </span>
              </button>
            </div>
          </div>

          <div
            id="product-detail-panel-overview"
            role="tabpanel"
            aria-labelledby="product-tab-overview"
            hidden={detailTab !== "overview"}
          >
            <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
              <div className="min-w-0 space-y-8 lg:col-span-2">
              <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800 dark:shadow-none">
                <CardHeader className="border-b border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/35">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold">Chỉnh sửa thông tin</CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Cập nhật danh mục, tên, mô tả, giá, bảo hành, trạng thái và ảnh đại diện.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                      onClick={() => openEditProductDialog()}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Sửa sản phẩm
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-800 dark:text-teal-300">
                      <Package className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold">Hình ảnh & mô tả</CardTitle>
                      <CardDescription className="text-xs">Ảnh đại diện sản phẩm và nội dung mô tả</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-5 sm:p-6">
                  <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="max-h-[min(22rem,50vh)] w-full object-contain object-center"
                        loading="eager"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] max-h-80 flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                        <ImageIcon className="h-12 w-12 opacity-50" strokeWidth={1.5} aria-hidden />
                        <span className="text-sm font-medium">Chưa có ảnh đại diện</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mô tả</h3>
                    {product.description?.trim() ? (
                      <p className="max-w-[65ch] whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {product.description}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có mô tả.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800 dark:shadow-none">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300">
                        <Tag className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </span>
                      <div>
                        <CardTitle className="text-base font-semibold">Thuộc tính</CardTitle>
                        <CardDescription className="text-xs">{attributes.length} nhóm thuộc tính</CardDescription>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                      onClick={() => openUpsertAttributesDialog()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm / cập nhật
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  {attributes.length === 0 ? (
                    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/30 px-4 py-8 dark:border-slate-700 dark:bg-slate-900/20">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Chưa có thuộc tính. Thêm nhóm tên và giá trị để hiển thị trên sản phẩm.</p>
                      <Button type="button" size="sm" className="gap-1.5" onClick={() => openUpsertAttributesDialog()}>
                        <Plus className="h-3.5 w-3.5" />
                        Thêm thuộc tính
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attributes.map((attr) => (
                        <li
                          key={attr.id}
                          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-6"
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-8">
                            <div className="shrink-0 sm:w-40">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{attr.name}</p>
                              <p className="font-mono text-[11px] text-slate-400">#{attr.id}</p>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                              {(attr.values ?? []).map((v) => (
                                <span
                                  key={v.id}
                                  className="inline-flex rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                >
                                  {v.value}
                                  <span className="ml-1.5 font-mono text-[10px] text-slate-400">#{v.id}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex shrink-0 justify-end sm:pt-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-500 hover:bg-red-500/10 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-400"
                              title="Xóa thuộc tính"
                              aria-label={`Xóa thuộc tính ${attr.name}`}
                              onClick={() => openDeleteAttributeDialog(attr)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              </div>

              <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 dark:shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tóm tắt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Giá cơ bản</p>
                    <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                      {formatMoneyVnd(product.basePrice)}
                    </p>
                  </div>
                  <dl className="space-y-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Bảo hành</dt>
                      <dd className="font-mono font-medium tabular-nums text-slate-900 dark:text-slate-100">
                        {product.warrantyPeriodMonths != null ? `${product.warrantyPeriodMonths} tháng` : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Biến thể</dt>
                      <dd className="font-mono font-medium tabular-nums text-slate-900 dark:text-slate-100">
                        {product.variantCount ?? variants.length}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Thuộc tính</dt>
                      <dd className="font-mono font-medium tabular-nums text-slate-900 dark:text-slate-100">
                        {product.attributeCount ?? attributes.length}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">ID sản phẩm</dt>
                      <dd className="font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">#{product.id}</dd>
                    </div>
                  </dl>
                  <Link
                    to={PRODUCTS_LIST_PATH}
                    className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-transform active:scale-[0.98] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    Quay lại danh sách
                  </Link>
                </CardContent>
              </Card>
              </aside>
            </div>
          </div>

          <div
            id="product-detail-panel-variants"
            role="tabpanel"
            aria-labelledby="product-tab-variants"
            hidden={detailTab !== "variants"}
          >
            <VariantsStockCard
              variants={variants}
              onEditVariant={openEditVariantDialog}
              headerActions={
                <Button type="button" size="sm" className="gap-1.5 shadow-sm transition-transform active:scale-[0.98]" onClick={openCreateVariantDialog}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Tạo biến thể
                </Button>
              }
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
