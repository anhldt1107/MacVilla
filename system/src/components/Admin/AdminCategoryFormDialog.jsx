import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiRequestError, getEnvelopeFieldErrors } from "@/services/api/apiEnvelope";
import {
  collectAdminCategorySubtreeIds,
  createAdminCategory,
  fetchAdminCategoryById,
  findAdminCategoryNode,
  flattenCategoryTreeForSelect,
  updateAdminCategory,
} from "@/services/admin/adminCategoriesApi";
import { suggestSlugFromName } from "@/lib/slug";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

/** @param {{ label: string; error?: string; children: import("react").ReactNode }} props */
function FieldWrap({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {'create' | 'edit'} props.mode
 * @param {number | null | undefined} props.editCategoryId
 * @param {string | null | undefined} props.accessToken
 * @param {import("@/services/admin/adminCategoriesApi").AdminCategoryTreeNode[]} props.tree
 * @param {() => void} props.onSaved
 */
export function AdminCategoryFormDialog({ open, onOpenChange, mode, editCategoryId, accessToken, tree, onSaved }) {
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadError, setLoadError] = useState("");
  /** @type {[import("@/services/admin/adminCategoriesApi").AdminCategoryDetail | null, React.Dispatch<React.SetStateAction<import("@/services/admin/adminCategoriesApi").AdminCategoryDetail | null>>]} */
  const [detail, setDetail] = useState(null);

  const [parentIdStr, setParentIdStr] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  /** @type {[Record<string, string>, React.Dispatch<React.SetStateAction<Record<string, string>>>]} */
  const [fieldErrors, setFieldErrors] = useState({});

  const excludedParentIds = useMemo(() => {
    if (mode !== "edit" || editCategoryId == null) return new Set();
    const node = findAdminCategoryNode(tree, editCategoryId);
    if (!node) return new Set([editCategoryId]);
    return new Set(collectAdminCategorySubtreeIds(node));
  }, [mode, editCategoryId, tree]);

  const parentOptions = useMemo(() => {
    return flattenCategoryTreeForSelect(tree).filter((o) => !excludedParentIds.has(o.id));
  }, [tree, excludedParentIds]);

  useEffect(() => {
    if (!open || !accessToken) return;

    if (mode === "create") {
      setDetail(null);
      setLoadError("");
      setLoadingDetail(false);
      setParentIdStr("");
      setName("");
      setSlug("");
      setImageUrl("");
      setRemoveImage(false);
      setFormError("");
      setFieldErrors({});
      return;
    }

    if (mode === "edit" && editCategoryId != null) {
      let cancelled = false;
      setFormError("");
      setFieldErrors({});
      setLoadingDetail(true);
      setLoadError("");
      setDetail(null);

      fetchAdminCategoryById(accessToken, editCategoryId)
        .then((d) => {
          if (cancelled) return;
          setDetail(d);
          setParentIdStr(d.parentId == null ? "" : String(d.parentId));
          setName(d.name);
          setSlug(d.slug);
          setImageUrl(d.imageUrl ?? "");
          setRemoveImage(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setLoadError(e instanceof ApiRequestError ? e.message : "Không tải được danh mục.");
        })
        .finally(() => {
          if (!cancelled) setLoadingDetail(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [open, mode, editCategoryId, accessToken]);

  const applyApiError = useCallback((e) => {
    const fromApi = getEnvelopeFieldErrors(e);
    setFieldErrors(fromApi);
    if (e instanceof ApiRequestError) {
      setFormError(e.message || "Có lỗi xảy ra.");
    } else {
      setFormError("Có lỗi xảy ra.");
    }
  }, []);

  const suggestSlug = useCallback(() => {
    setSlug(suggestSlugFromName(name));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.slug;
      return next;
    });
  }, [name]);

  const handleSubmit = useCallback(async () => {
    if (!accessToken) return;
    setFormError("");
    setFieldErrors({});

    const nameTrim = name.trim();
    const slugTrim = slug.trim();
    /** @type {Record<string, string>} */
    const local = {};
    if (!nameTrim) local.name = "Nhập tên danh mục.";
    if (mode === "edit" && !slugTrim) local.slug = "Slug là bắt buộc khi cập nhật.";

    const parentId = parentIdStr === "" ? null : Number(parentIdStr);
    if (parentIdStr !== "" && Number.isNaN(parentId)) {
      local.parentId = "Danh mục cha không hợp lệ.";
    }
    if (parentId != null && excludedParentIds.has(parentId)) {
      local.parentId = "Không thể chọn chính nút này hoặc danh mục con làm cha.";
    }

    if (Object.keys(local).length) {
      setFieldErrors(local);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        await createAdminCategory(accessToken, {
          parentId,
          name: nameTrim,
          slug: slugTrim || null,
          imageUrl: imageUrl.trim() || null,
        });
      } else if (mode === "edit" && editCategoryId != null) {
        /** @type {import("@/services/admin/adminCategoriesApi").AdminCategoryUpdatePayload} */
        const payload = {
          parentId,
          name: nameTrim,
          slug: slugTrim,
        };
        const initialUrl = detail?.imageUrl ?? "";
        if (removeImage) {
          payload.imageUrl = "";
        } else {
          const urlT = imageUrl.trim();
          const initTrim = initialUrl.trim();
          if (urlT !== initTrim && !(urlT === "" && initTrim !== "")) {
            payload.imageUrl = urlT;
          }
        }
        await updateAdminCategory(accessToken, editCategoryId, payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      applyApiError(e);
    } finally {
      setSubmitting(false);
    }
  }, [
    accessToken,
    name,
    slug,
    parentIdStr,
    imageUrl,
    removeImage,
    mode,
    editCategoryId,
    detail,
    excludedParentIds,
    onSaved,
    onOpenChange,
    applyApiError,
  ]);

  const initialImage = detail?.imageUrl ?? "";
  const editBlocked = mode === "edit" && (loadingDetail || !!loadError || !detail);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={(e) => submitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm danh mục" : "Sửa danh mục"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Để trống mã URL để hệ thống tự tạo."
              : "Cập nhật thông tin danh mục; có thể bỏ ảnh bên dưới."}
          </DialogDescription>
        </DialogHeader>

        {mode === "edit" && loadingDetail ? (
          <div className="flex flex-col items-center gap-3 py-10 text-slate-600 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600/80" aria-hidden />
            <p className="text-sm">Đang tải chi tiết…</p>
          </div>
        ) : null}

        {mode === "edit" && loadError ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            {loadError}
          </div>
        ) : null}

        {!(mode === "edit" && (loadingDetail || loadError || !detail)) || mode === "create" ? (
          <div className="space-y-4 py-1">
            <FieldWrap label="Danh mục cha" error={fieldErrors.parentId}>
              <select
                className={fieldSelect}
                value={parentIdStr}
                onChange={(e) => setParentIdStr(e.target.value)}
                disabled={editBlocked || submitting}
                aria-invalid={!!fieldErrors.parentId}
              >
                <option value="">Gốc (không có cha)</option>
                {parentOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FieldWrap>

            <FieldWrap label="Tên" error={fieldErrors.name}>
              <input
                type="text"
                className={fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={editBlocked || submitting}
                placeholder="Ví dụ: Phòng khách"
                autoComplete="off"
                aria-invalid={!!fieldErrors.name}
              />
            </FieldWrap>

            <FieldWrap
              label={mode === "create" ? "Slug (tuỳ chọn)" : "Slug"}
              error={fieldErrors.slug}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  className={cn(fieldInput, "flex-1 font-mono text-xs")}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={editBlocked || submitting}
                  placeholder={mode === "create" ? "Để trống để hệ thống tự tạo" : ""}
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.slug}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={editBlocked || submitting || !name.trim()}
                  onClick={suggestSlug}
                >
                  Gợi ý
                </Button>
              </div>
            </FieldWrap>

            <FieldWrap label="Ảnh (URL)" error={fieldErrors.imageUrl}>
              <input
                type="url"
                className={cn(fieldInput, "font-mono text-xs")}
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setRemoveImage(false);
                }}
                disabled={editBlocked || submitting || removeImage}
                placeholder="https://…"
                autoComplete="off"
                aria-invalid={!!fieldErrors.imageUrl}
              />
              {mode === "edit" && initialImage ? (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 dark:border-slate-600"
                    checked={removeImage}
                    disabled={editBlocked || submitting}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setRemoveImage(on);
                      if (on) setImageUrl("");
                    }}
                  />
                  Xóa ảnh hiện tại trên máy chủ
                </label>
              ) : null}
            </FieldWrap>

            {mode === "edit" && detail ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Thống kê:</span>{" "}
                <span className="font-mono tabular-nums">{detail.childrenCount}</span> danh mục con ·{" "}
                <span className="font-mono tabular-nums">{detail.productsCount}</span> sản phẩm
              </p>
            ) : null}

            {formError ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            type="button"
            disabled={submitting || editBlocked || !accessToken}
            onClick={() => void handleSubmit()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Đang lưu…
              </>
            ) : mode === "create" ? (
              "Tạo"
            ) : (
              "Cập nhật"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
