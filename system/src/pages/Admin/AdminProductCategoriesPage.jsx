import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  collectCategoryIdsWithChildren,
  countCategoryTreeNodes,
  fetchAdminCategoriesList,
  fetchAdminCategoryTree,
} from "@/services/admin/adminCategoriesApi";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderTree,
  ImageIcon,
  LayoutList,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { AdminCategoryFormDialog } from "@/components/Admin/AdminCategoryFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const fieldSelect = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "cursor-pointer appearance-none bg-transparent pr-10",
  "hover:border-slate-300 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

/** @param {import("@/services/admin/adminCategoriesApi").AdminCategoryTreeNode[]} nodes */
function renderCategoryRows(nodes, depth, expanded, toggle, onEdit) {
  const rows = [];
  if (!nodes?.length) return rows;

  for (const node of nodes) {
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const isOpen = expanded.has(node.id);
    const pad = 12 + depth * 20;

    rows.push(
      <tr
        key={node.id}
        className={cn(
          "border-b border-slate-100 transition-colors hover:bg-slate-500/[0.04] dark:border-slate-800 dark:hover:bg-slate-500/[0.06]",
          depth === 0 && "bg-slate-50/50 dark:bg-slate-900/30",
          depth > 0 && "bg-white dark:bg-slate-950/80"
        )}
      >
        <td className="align-middle">
          <div className="flex min-w-0 items-center gap-1 py-3 pl-2 pr-3" style={{ paddingLeft: pad }}>
            {hasChildren ? (
              <button
                type="button"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                )}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Thu gọn" : "Mở rộng"}
                title={isOpen ? "Thu gọn" : "Mở rộng"}
                onClick={() => toggle(node.id)}
              >
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            ) : (
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden>
                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-900 dark:text-slate-100">{node.name}</div>
              {node.parentId != null ? (
                <div className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">Cha #{node.parentId}</div>
              ) : (
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-teal-700/90 dark:text-teal-400/90">
                  Danh mục gốc
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="align-middle px-3 py-3">
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{node.slug}</span>
        </td>
        <td className="whitespace-nowrap px-3 py-3 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {node.id}
        </td>
        <td className="px-3 py-3 align-middle">
          {node.imageUrl ? (
            <a
              href={node.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
            >
              <img
                src={node.imageUrl}
                alt=""
                className="h-9 w-9 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                loading="lazy"
              />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <ImageIcon className="h-4 w-4 opacity-60" aria-hidden />
              —
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-3 align-middle text-right">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onEdit(node.id)}>
            Sửa
          </Button>
        </td>
      </tr>
    );

    if (hasChildren && isOpen) {
      rows.push(...renderCategoryRows(children, depth + 1, expanded, toggle, onEdit));
    }
  }

  return rows;
}

function listImageCell(imageUrl) {
  if (imageUrl) {
    return (
      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
      >
        <img
          src={imageUrl}
          alt=""
          className="h-9 w-9 rounded-md border border-slate-200 object-cover dark:border-slate-700"
          loading="lazy"
        />
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
      <ImageIcon className="h-4 w-4 opacity-60" aria-hidden />
      —
    </span>
  );
}

export function AdminProductCategoriesPage() {
  const { accessToken, isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState(/** @type {'tree' | 'list'} */ ("tree"));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tree, setTree] = useState(/** @type {import("@/services/admin/adminCategoriesApi").AdminCategoryTreeNode[]} */ ([]));
  const [listData, setListData] = useState(
    /** @type {import("@/services/admin/adminCategoriesApi").AdminCategoryListResult | null} */ (null)
  );
  const [expanded, setExpanded] = useState(() => new Set(/** @type {number[]} */ ([])));

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState(/** @type {"create" | "edit"} */ ("create"));
  const [editCategoryId, setEditCategoryId] = useState(/** @type {number | null} */ (null));

  useEffect(() => {
    setPage(1);
  }, [viewMode, pageSize]);

  const loadTree = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCategoryTree(accessToken);
      setTree(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được cây danh mục.";
      setError(msg);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  const loadList = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCategoriesList(accessToken, { page, pageSize });
      setListData(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách danh mục.";
      setError(msg);
      setListData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    if (viewMode !== "tree") return;
    void loadTree();
  }, [isAuthenticated, accessToken, viewMode, loadTree]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    if (viewMode !== "list") return;
    void loadList();
  }, [isAuthenticated, accessToken, viewMode, page, pageSize, loadList]);

  const refresh = useCallback(() => {
    if (viewMode === "tree") loadTree();
    else loadList();
  }, [viewMode, loadTree, loadList]);

  const openCreateCategory = useCallback(() => {
    setCategoryFormMode("create");
    setEditCategoryId(null);
    setCategoryFormOpen(true);
  }, []);

  const openEditCategory = useCallback((id) => {
    setCategoryFormMode("edit");
    setEditCategoryId(id);
    setCategoryFormOpen(true);
  }, []);

  const toggle = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(collectCategoryIdsWithChildren(tree));
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const totalNodes = useMemo(() => countCategoryTreeNodes(tree), [tree]);
  const rootCount = tree.length;

  const tableRows = useMemo(
    () => renderCategoryRows(tree, 0, expanded, toggle, openEditCategory),
    [tree, expanded, toggle, openEditCategory]
  );

  const listItems = listData?.items ?? [];
  const listTotal = listData?.totalCount ?? 0;
  const listTotalPages = Math.max(1, Math.ceil(listTotal / pageSize) || 1);

  const isList = viewMode === "list";

  return (
    <div className="space-y-6">
      <AdminCategoryFormDialog
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        mode={categoryFormMode}
        editCategoryId={editCategoryId}
        accessToken={accessToken}
        tree={tree}
        onSaved={refresh}
      />
      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Danh mục sản phẩm
          </CardTitle>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
            onClick={openCreateCategory}
            disabled={loading || !isAuthenticated}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Thêm danh mục
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 sm:col-span-2 lg:col-span-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hiển thị
              </span>
              <div
                className="flex h-10 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-3 shadow-sm dark:border-slate-700 dark:bg-slate-950"
                role="group"
                aria-label="Chế độ hiển thị"
              >
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    !isList ? "text-teal-800 dark:text-teal-300" : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  <FolderTree className="h-3.5 w-3.5" aria-hidden />
                  Cây
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isList}
                  aria-label={isList ? "Đang xem danh sách, bấm để chuyển cây" : "Đang xem cây, bấm để chuyển danh sách"}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
                    isList ? "bg-teal-600 dark:bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
                  )}
                  onClick={() => setViewMode((m) => (m === "tree" ? "list" : "tree"))}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 dark:bg-slate-100",
                      isList && "translate-x-5"
                    )}
                    aria-hidden
                  />
                </button>
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    isList ? "text-teal-800 dark:text-teal-300" : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  <LayoutList className="h-3.5 w-3.5" aria-hidden />
                  Danh sách
                </span>
              </div>
            </div>

            {!isList ? (
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={expandAll}
                  disabled={loading || rootCount === 0}
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden />
                  Mở tất cả
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={collapseAll}
                  disabled={loading || rootCount === 0}
                >
                  <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden />
                  Thu tất cả
                </Button>
              </div>
            ) : (
              <div className="space-y-2 lg:col-span-3">
                <label
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  htmlFor="admin-cat-page-size"
                >
                  Số dòng / trang
                </label>
                <div className="relative">
                  <select
                    id="admin-cat-page-size"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className={fieldSelect}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} / trang
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
              <Button
                type="button"
                size="sm"
                className="gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => refresh()}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Làm mới
              </Button>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {loading ? (
              "Đang tải…"
            ) : isList ? (
              <>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{listTotal.toLocaleString("vi-VN")}</span> danh mục
                {listTotal > 0 ? (
                  <>
                    {" "}
                    · trang {page} / {listTotalPages}
                  </>
                ) : null}
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{rootCount}</span> danh mục gốc ·{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{totalNodes}</span> mục trong cây
              </>
            )}
          </p>
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
        {!isList ? (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                    <th className="py-3.5 pl-4 pr-3">Tên danh mục</th>
                    <th className="px-3 py-3.5">Slug</th>
                    <th className="px-3 py-3.5">ID</th>
                    <th className="px-3 py-3.5">Ảnh</th>
                    <th className="px-3 py-3.5 pr-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && tree.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                          <Loader2 className="h-8 w-8 animate-spin text-teal-600/70" />
                          <span className="text-sm font-medium">Đang tải cây danh mục…</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {!loading && tree.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-600 dark:text-slate-300">
                        Chưa có danh mục.
                      </td>
                    </tr>
                  ) : null}
                  {tableRows}
                </tbody>
              </table>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                    <th className="py-3.5 pl-4 pr-3 font-mono">ID</th>
                    <th className="px-3 py-3.5">Tên</th>
                    <th className="px-3 py-3.5">Slug</th>
                    <th className="px-3 py-3.5">Danh mục cha</th>
                    <th className="px-3 py-3.5">Ảnh</th>
                    <th className="px-3 py-3.5 pr-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && listItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                          <Loader2 className="h-8 w-8 animate-spin text-teal-600/70" />
                          <span className="text-sm font-medium">Đang tải danh sách…</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {!loading && listItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-600 dark:text-slate-300">
                        Không có danh mục trên trang này.
                      </td>
                    </tr>
                  ) : null}
                  {listItems.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "transition-colors hover:bg-slate-500/[0.04] dark:hover:bg-slate-500/[0.06]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                      )}
                    >
                      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {row.id}
                      </td>
                      <td className="max-w-[240px] px-3 py-3.5 font-medium text-slate-900 dark:text-slate-100">{row.name}</td>
                      <td className="px-3 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">{row.slug}</td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        {row.parentId == null ? (
                          <span className="inline-flex rounded-full bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:text-teal-200">
                            Gốc
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">#{row.parentId}</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">{listImageCell(row.imageUrl)}</td>
                      <td className="px-3 py-3.5 pr-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => openEditCategory(row.id)}
                        >
                          Sửa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {listTotal > 0 ? (
                  <>
                    Hiển thị{" "}
                    <span className="font-medium font-mono tabular-nums text-slate-700 dark:text-slate-200">
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, listTotal)}
                    </span>{" "}
                    trong tổng{" "}
                    <span className="font-medium font-mono tabular-nums text-slate-700 dark:text-slate-200">
                      {listTotal.toLocaleString("vi-VN")}
                    </span>
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
                  className="h-9 gap-1"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <span className="min-w-[5rem] text-center font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                  {page} / {listTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1"
                  disabled={loading || page >= listTotalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
