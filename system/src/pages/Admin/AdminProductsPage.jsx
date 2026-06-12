import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminCategoryTree, flattenCategoryTreeForSelect } from "@/services/admin/adminCategoriesApi";
import {
  ADMIN_PRODUCT_STATUS_OPTIONS,
  adminProductStatusBadgeClass,
  createAdminProduct,
  fetchAdminProducts,
  labelAdminProductStatus,
} from "@/services/admin/adminProductsApi";
import { uploadAdminFile } from "@/services/admin/adminUploadsApi";
import { ChevronDown, ChevronLeft, ChevronRight, ImageIcon, Loader2, Package, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Trạng thái khi tạo mới (bỏ mục «Tất cả»). */
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

function formatPriceVND(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

export function AdminProductsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [includeSubcategories, setIncludeSubcategories] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [categoryTree, setCategoryTree] = useState(
    /** @type {import("@/services/admin/adminCategoriesApi").AdminCategoryTreeNode[]} */ ([])
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const categoryOptions = useMemo(() => flattenCategoryTreeForSelect(categoryTree), [categoryTree]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    categoryId: "",
    name: "",
    slug: "",
    description: "",
    basePrice: "",
    warrantyPeriodMonths: "",
    status: "Active",
  });
  const [createImageFile, setCreateImageFile] = useState(/** @type {File | null} */ (null));
  const createFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const resetCreateProductForm = useCallback(() => {
    setCreateForm({
      categoryId: "",
      name: "",
      slug: "",
      description: "",
      basePrice: "",
      warrantyPeriodMonths: "",
      status: "Active",
    });
    setCreateImageFile(null);
    const el = createFileInputRef.current;
    if (el) el.value = "";
  }, []);

  const openCreateProductDialog = useCallback(() => {
    setCreateError("");
    resetCreateProductForm();
    setCreateOpen(true);
  }, [resetCreateProductForm]);

  const submitCreateProduct = async () => {
    if (!accessToken) return;
    if (!createForm.categoryId.trim()) {
      setCreateError("Chọn danh mục.");
      return;
    }
    if (!createForm.name.trim() || !createForm.slug.trim()) {
      setCreateError("Nhập tên và slug sản phẩm.");
      return;
    }
    const bp = Number(createForm.basePrice);
    if (!Number.isFinite(bp) || bp < 0) {
      setCreateError("Giá cơ bản phải là số không âm.");
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      let imageUrl = "";
      if (createImageFile) {
        const uploadData = await uploadAdminFile(accessToken, createImageFile, "product");
        imageUrl = typeof uploadData?.secureUrl === "string" ? uploadData.secureUrl.trim() : "";
        if (!imageUrl) throw new Error("Upload ảnh thất bại.");
      }

      /** @type {import("@/services/admin/adminProductsApi").AdminProductCreatePayload} */
      const payload = {
        categoryId: Number(createForm.categoryId),
        name: createForm.name.trim(),
        slug: createForm.slug.trim(),
        basePrice: bp,
        status: createForm.status,
      };
      if (createForm.description.trim()) payload.description = createForm.description.trim();
      const wTrim = createForm.warrantyPeriodMonths.trim();
      if (wTrim) {
        const w = Number(wTrim);
        if (Number.isFinite(w) && w >= 0) payload.warrantyPeriodMonths = w;
      }
      if (imageUrl) payload.imageUrl = imageUrl;

      const created = await createAdminProduct(accessToken, payload);
      setCreateOpen(false);
      resetCreateProductForm();
      navigate(`/admin/products/${created.id}`);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tạo được sản phẩm.";
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

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

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, status, categoryId, includeSubcategories, pageSize]);

  useEffect(() => {
    if (!categoryId.trim()) setIncludeSubcategories(true);
  }, [categoryId]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminProducts(accessToken, {
        page,
        pageSize,
        search: search.trim(),
        status,
        categoryId: categoryId.trim(),
        includeSubcategories,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách sản phẩm.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, search, status, categoryId, includeSubcategories]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setCategoryId("");
    setIncludeSubcategories(true);
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() || status || categoryId.trim() || (Boolean(categoryId.trim()) && !includeSubcategories)
  );

  return (
    <div className="space-y-6">
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateError("");
            resetCreateProductForm();
          }
        }}
      >
        <DialogContent
          className="grid max-h-[min(90dvh,calc(100vh-2rem))] min-h-0 w-[calc(100vw-1.5rem)] max-w-lg grid-rows-[minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:w-full sm:max-w-lg"
          onPointerDownOutside={(e) => createSubmitting && e.preventDefault()}
        >
          <div className="min-h-0 overflow-y-auto overscroll-contain p-6 pb-4">
            <DialogHeader>
              <DialogTitle>Tạo sản phẩm</DialogTitle>
              <DialogDescription>Điền thông tin sản phẩm; có thể tải ảnh đại diện.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-category">
                  Danh mục <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="create-prod-category"
                    value={createForm.categoryId}
                    disabled={categoriesLoading}
                    onChange={(e) => setCreateForm((f) => ({ ...f, categoryId: e.target.value }))}
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-name">
                  Tên sản phẩm <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="create-prod-name"
                  type="text"
                  className={fieldInput}
                  placeholder="Hàng xấu"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-slug">
                    Slug <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
                    onClick={() => setCreateForm((f) => ({ ...f, slug: suggestSlugFromName(f.name) }))}
                  >
                    Gợi ý từ tên
                  </Button>
                </div>
                <input
                  id="create-prod-slug"
                  type="text"
                  className={fieldInput}
                  placeholder="hang-xau"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-desc">
                  Mô tả
                </label>
                <textarea
                  id="create-prod-desc"
                  className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
                  placeholder="Mô tả ngắn…"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-price">
                    Giá cơ bản (đ) <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    id="create-prod-price"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className={fieldInput}
                    placeholder="50000"
                    value={createForm.basePrice}
                    onChange={(e) => setCreateForm((f) => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-warranty">
                    Bảo hành (tháng)
                  </label>
                  <input
                    id="create-prod-warranty"
                    type="number"
                    min={0}
                    step={1}
                    className={fieldInput}
                    placeholder="1200"
                    value={createForm.warrantyPeriodMonths}
                    onChange={(e) => setCreateForm((f) => ({ ...f, warrantyPeriodMonths: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-status">
                  Trạng thái <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="create-prod-status"
                    value={createForm.status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="create-prod-image">
                  Ảnh đại diện (tùy chọn)
                </label>
                <input
                  ref={createFileInputRef}
                  id="create-prod-image"
                  type="file"
                  accept="image/*"
                  className={cn(
                    "block w-full cursor-pointer rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:file:bg-violet-700"
                  )}
                  onChange={(e) => setCreateImageFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            {createError ? (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {createError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="relative z-10 shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <Button type="button" variant="outline" disabled={createSubmitting} onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="button" className="gap-1.5" disabled={createSubmitting} onClick={() => void submitCreateProduct()}>
              {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              Tạo sản phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">Sản phẩm</CardTitle>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
            onClick={openCreateProductDialog}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tạo sản phẩm
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-prod-search"
              >
                Tìm kiếm
              </label>
              <input
                id="admin-prod-search"
                type="search"
                placeholder="Tên, slug…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={fieldInput}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-prod-status"
              >
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="admin-prod-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {ADMIN_PRODUCT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-prod-category"
              >
                Danh mục
              </label>
              <div className="relative">
                <select
                  id="admin-prod-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={categoriesLoading}
                  className={cn(fieldSelect, categoriesLoading && "opacity-60")}
                >
                  <option value="">Tất cả danh mục</option>
                  {categoryOptions.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2 lg:col-span-2">
              <input
                id="admin-prod-subcat"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/30 dark:border-slate-600 dark:bg-slate-950"
                checked={includeSubcategories}
                disabled={!categoryId.trim()}
                onChange={(e) => setIncludeSubcategories(e.target.checked)}
              />
              <label htmlFor="admin-prod-subcat" className={cn("text-sm text-slate-700 dark:text-slate-300", !categoryId.trim() && "opacity-50")}>
                Gồm danh mục con
              </label>
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
              {loading ? "Danh sách sản phẩm" : `Danh sách sản phẩm · ${totalCount.toLocaleString("vi-VN")} sản phẩm`}
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
            <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="w-16 py-3.5 pl-6 pr-2">Ảnh</th>
                  <th className="px-3 py-3.5">Sản phẩm</th>
                  <th className="px-3 py-3.5">Danh mục</th>
                  <th className="px-3 py-3.5 text-right">Giá</th>
                  <th className="whitespace-nowrap px-3 py-3.5 text-center">BH (tháng)</th>
                  <th className="px-3 py-3.5">Trạng thái</th>
                  <th className="whitespace-nowrap px-3 py-3.5 text-center font-mono">Biến thể</th>
                  <th className="whitespace-nowrap px-3 py-3.5 text-center font-mono">Thuộc tính</th>
                  <th className="whitespace-nowrap py-3.5 pl-3 pr-6 font-mono">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600/70" />
                        <span className="text-sm font-medium">Đang tải sản phẩm…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có sản phẩm phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc hoặc từ khóa.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                    onClick={() => navigate(`/admin/products/${row.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/admin/products/${row.id}`);
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
                    <td className="max-w-[260px] px-3 py-3.5 align-middle">
                      <div className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
                      <div className="mt-0.5 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{row.slug}</div>
                    </td>
                    <td className="max-w-[200px] px-3 py-3.5 align-middle text-sm text-slate-800 dark:text-slate-200">
                      <div className="truncate" title={row.categoryName}>
                        {row.categoryName || "—"}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">#{row.categoryId}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatPriceVND(row.basePrice)}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle tabular-nums text-slate-700 dark:text-slate-300">
                      {row.warrantyPeriodMonths != null ? row.warrantyPeriodMonths : "—"}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          adminProductStatusBadgeClass(row.status)
                        )}
                      >
                        {labelAdminProductStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {row.variantCount ?? "—"}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {row.attributeCount ?? "—"}
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-3 pr-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {row.id}
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
                  sản phẩm
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
