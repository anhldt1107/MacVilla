import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  INVENTORY_REFERENCE_TYPE_CREATE_OPTIONS,
  INVENTORY_TRANSACTION_TYPE_CREATE_OPTIONS,
  INVENTORY_TRANSACTION_TYPE_OPTIONS,
  createAdminInventoryTransaction,
  fetchAdminInventoryTransactionDetail,
  fetchAdminInventoryTransactions,
  inventoryReferenceTypeBadgeClass,
  inventoryTransactionTypeBadgeClass,
  labelInventoryReferenceType,
  labelInventoryTransactionType,
} from "@/services/admin/adminInventoryTransactionsApi";
import { AdminVariantSearchPicker } from "@/components/Admin/inventory/AdminVariantSearchPicker";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  RefreshCw,
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
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 7);
  return { fromDate: toYmd(from), toDate: toYmd(to) };
}

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

const NOTES_MAX = 1000;

function pickTx(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/** Xuất CSV (UTF-8 BOM) từ các dòng đang hiển thị —  UX gợi ý. */
function downloadInventoryTransactionsCsv(items, page) {
  const cols = [
    { key: "id", label: "ID" },
    { key: "variantId", label: "variantId" },
    { key: "transactionType", label: "Loại" },
    { key: "quantity", label: "Số lượng" },
    { key: "referenceType", label: "Loại tham chiếu" },
    { key: "referenceId", label: "Mã tham chiếu" },
    { key: "timestamp", label: "Thời điểm" },
    { key: "productName", label: "Sản phẩm" },
    { key: "variantName", label: "Biến thể" },
    { key: "variantSku", label: "SKU" },
  ];
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    if (/[";\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = cols.map((c) => esc(c.label)).join(";");
  const lines = [
    header,
    ...items.map((row) =>
      cols
        .map((c) => {
          const v = row[c.key] ?? row[c.key.charAt(0).toUpperCase() + c.key.slice(1)];
          return esc(v);
        })
        .join(";")
    ),
  ];
  const blob = new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `giao-dich-kho-trang-${page}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {{ initialVariantFilter?: string }} [props]
 */
export function AdminInventoryTransactionsPage({ initialVariantFilter = "" } = {}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [type, setType] = useState("");
  const [variantId, setVariantId] = useState(() => String(initialVariantFilter ?? "").trim());
  /** Mặc định 7 ngày gần nhất (). */
  const [fromDate, setFromDate] = useState(() => defaultDateRange().fromDate);
  const [toDate, setToDate] = useState(() => defaultDateRange().toDate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    variantId: "",
    transactionType: "IN",
    quantity: "",
    referenceType: "",
    referenceId: "",
    notes: "",
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(/** @type {number | null} */ (null));
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [detailError, setDetailError] = useState("");

  const resetCreateForm = useCallback(() => {
    setCreateForm({
      variantId: "",
      transactionType: "IN",
      quantity: "",
      referenceType: "",
      referenceId: "",
      notes: "",
    });
  }, []);

  const openCreateDialog = useCallback(() => {
    setCreateError("");
    resetCreateForm();
    setCreateOpen(true);
  }, [resetCreateForm]);

  useEffect(() => {
    const v = String(initialVariantFilter ?? "").trim();
    if (v) setVariantId(v);
  }, [initialVariantFilter]);

  useEffect(() => {
    setPage(1);
  }, [type, variantId, fromDate, toDate, pageSize]);

  const load = useCallback(
    /**
     * @param {number} [pageOverride] — dùng khi vừa `setPage` (state chưa kịp cập nhật).
     */
    async (pageOverride) => {
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }
      const effectivePage = typeof pageOverride === "number" && pageOverride >= 1 ? pageOverride : page;
      setLoading(true);
      setError("");
      try {
        const result = await fetchAdminInventoryTransactions(accessToken, {
          page: effectivePage,
          pageSize,
          type,
          variantId: variantId.trim(),
          fromDate: fromDate.trim(),
          toDate: toDate.trim(),
        });
        setData(result);
      } catch (e) {
        const msg =
          e instanceof ApiRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Không tải được danh sách giao dịch kho.";
        setError(msg);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, isAuthenticated, page, pageSize, type, variantId, fromDate, toDate]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setType("");
    setVariantId("");
    const d = defaultDateRange();
    setFromDate(d.fromDate);
    setToDate(d.toDate);
  };

  const defaultRangeNow = defaultDateRange();
  const hasActiveFilters = Boolean(
    type ||
      variantId.trim() ||
      fromDate !== defaultRangeNow.fromDate ||
      toDate !== defaultRangeNow.toDate
  );

  const openDetail = useCallback(
    async (rowId) => {
      if (!accessToken || rowId == null) return;
      setDetailId(Number(rowId));
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailError("");
      setDetailData(null);
      try {
        const d = await fetchAdminInventoryTransactionDetail(accessToken, rowId);
        setDetailData(d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null);
      } catch (e) {
        setDetailError(e instanceof ApiRequestError ? e.message : "Không tải được chi tiết giao dịch.");
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken]
  );

  const submitCreateTransaction = async () => {
    if (createSubmitting) return;
    if (!accessToken) return;
    const vid = Number(createForm.variantId);
    if (!Number.isFinite(vid) || vid < 1) {
      setCreateError("Chọn biến thể từ danh sách (tìm SKU hoặc tên sản phẩm).");
      return;
    }
    const qty = Number(createForm.quantity);
    if (!Number.isFinite(qty) || qty === 0 || !Number.isInteger(qty)) {
      setCreateError("Số lượng phải là số nguyên khác 0.");
      return;
    }
    if (!createForm.transactionType) {
      setCreateError("Chọn loại giao dịch.");
      return;
    }
    const notesTrim = createForm.notes.trim();
    if (notesTrim.length > NOTES_MAX) {
      setCreateError(`Ghi chú tối đa ${NOTES_MAX} ký tự.`);
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      await createAdminInventoryTransaction(accessToken, {
        variantId: vid,
        transactionType: createForm.transactionType,
        quantity: qty,
        referenceType: createForm.referenceType.trim() || undefined,
        referenceId: createForm.referenceId.trim() || undefined,
        notes: notesTrim || undefined,
      });
      setCreateOpen(false);
      resetCreateForm();
      setPage(1);
      await load(1);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tạo được giao dịch kho.";
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateError("");
            resetCreateForm();
          }
        }}
      >
        <DialogContent
          className="grid max-h-[min(90dvh,calc(100vh-2rem))] min-h-0 w-[calc(100vw-1.5rem)] max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:w-full sm:max-w-lg"
          onPointerDownOutside={(e) => createSubmitting && e.preventDefault()}
        >
          <div className="relative z-[60] min-w-0 shrink-0 overflow-visible bg-background px-6 pb-2 pt-6">
            <DialogHeader>
              <DialogTitle>Tạo giao dịch kho</DialogTitle>
              <DialogDescription>
                Ghi nhận nhập, xuất, điều chỉnh hoặc giữ / giải phóng tồn theo biến thể (số lượng âm/dương theo loại giao dịch).
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 min-w-0">
              <AdminVariantSearchPicker
                accessToken={accessToken}
                idPrefix="inv-create"
                label="Biến thể"
                requiredMark
                placeholder="Chọn biến thể…"
                disabled={createSubmitting}
                value={createForm.variantId}
                onChange={(id) => setCreateForm((f) => ({ ...f, variantId: id }))}
              />
            </div>
          </div>
          <div className="relative z-0 min-h-0 overflow-y-auto overscroll-contain px-6 pb-4 pt-2">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    htmlFor="inv-create-type"
                  >
                    Loại giao dịch <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="inv-create-type"
                      value={createForm.transactionType}
                      onChange={(e) => setCreateForm((f) => ({ ...f, transactionType: e.target.value }))}
                      className={fieldSelect}
                    >
                      {INVENTORY_TRANSACTION_TYPE_CREATE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    htmlFor="inv-create-qty"
                  >
                    Số lượng <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    id="inv-create-qty"
                    type="number"
                    step={1}
                    inputMode="numeric"
                    placeholder="10"
                    value={createForm.quantity}
                    onChange={(e) => setCreateForm((f) => ({ ...f, quantity: e.target.value }))}
                    className={fieldInput}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  htmlFor="inv-create-ref-type"
                >
                  Loại chứng từ tham chiếu
                </label>
                <div className="relative">
                  <select
                    id="inv-create-ref-type"
                    value={createForm.referenceType}
                    onChange={(e) => setCreateForm((f) => ({ ...f, referenceType: e.target.value }))}
                    className={fieldSelect}
                  >
                    {INVENTORY_REFERENCE_TYPE_CREATE_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  htmlFor="inv-create-ref-id"
                >
                  Mã chứng từ (tùy chọn)
                </label>
                <input
                  id="inv-create-ref-id"
                  type="text"
                  placeholder="VD. PO-2026-001"
                  value={createForm.referenceId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, referenceId: e.target.value }))}
                  className={fieldInput}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  htmlFor="inv-create-notes"
                >
                  Ghi chú
                </label>
                <textarea
                  id="inv-create-notes"
                  rows={3}
                  placeholder="Ghi chú nội bộ…"
                  maxLength={NOTES_MAX}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                  className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
                />
                <p className="text-[11px] text-slate-500">
                  Tối đa {NOTES_MAX} ký tự · {createForm.notes.length}/{NOTES_MAX}
                </p>
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
          <DialogFooter className="relative z-30 shrink-0 gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-w-fit shrink-0"
              disabled={createSubmitting}
              onClick={() => setCreateOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="min-w-fit shrink-0 gap-1.5"
              disabled={createSubmitting}
              onClick={() => void submitCreateTransaction()}
            >
              {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              Tạo giao dịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailId(null);
            setDetailData(null);
            setDetailError("");
            setDetailLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch kho</DialogTitle>
            <DialogDescription>
              {detailId != null ? (
                <span className="font-mono tabular-nums">ID #{detailId}</span>
              ) : (
                "—"
              )}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
              <span className="text-sm">Đang tải…</span>
            </div>
          ) : null}
          {!detailLoading && detailError ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {detailError}
            </p>
          ) : null}
          {!detailLoading && !detailError && detailData ? (
            (() => {
              const rows = [
                ["id", "Id", "Mã giao dịch"],
                ["variantId", "VariantId", "Biến thể (ID)"],
                ["variantSku", "VariantSku", "SKU"],
                ["variantName", "VariantName", "Tên biến thể"],
                ["productName", "ProductName", "Sản phẩm"],
                ["transactionType", "TransactionType", "Loại giao dịch"],
                ["quantity", "Quantity", "Số lượng"],
                ["referenceType", "ReferenceType", "Loại tham chiếu"],
                ["referenceId", "ReferenceId", "Mã tham chiếu"],
                ["timestamp", "Timestamp", "Thời điểm"],
                ["notes", "Notes", "Ghi chú"],
                ["workerIdAssigned", "WorkerIdAssigned", "Nhân viên gán"],
                ["workerName", "WorkerName", "Tên nhân viên"],
                ["managerIdApproved", "ManagerIdApproved", "Quản lý duyệt (ID)"],
                ["managerName", "ManagerName", "Tên quản lý duyệt"],
              ]
                .map(([camel, pascal, label]) => {
                  const raw = pickTx(detailData, camel, pascal);
                  if (raw === undefined || raw === null || raw === "") return null;
                  let display = String(raw);
                  if (camel === "transactionType" || pascal === "TransactionType") {
                    display = labelInventoryTransactionType(String(raw));
                  } else if (camel === "referenceType" || pascal === "ReferenceType") {
                    display = labelInventoryReferenceType(String(raw));
                  } else if (camel === "timestamp" || pascal === "Timestamp") {
                    display = formatDateTime(String(raw));
                  } else if (camel === "quantity" || pascal === "Quantity") {
                    const n = Number(raw);
                    display = Number.isFinite(n) ? n.toLocaleString("vi-VN") : String(raw);
                  }
                  return (
                    <div key={camel} className="min-w-0 sm:col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {label}
                      </dt>
                      <dd className="mt-0.5 break-words font-medium text-slate-900 dark:text-slate-100">{display}</dd>
                    </div>
                  );
                })
                .filter(Boolean);
              if (rows.length === 0) {
                return <p className="text-sm text-slate-600 dark:text-slate-300">Không có trường chi tiết để hiển thị.</p>;
              }
              return <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">{rows}</dl>;
            })()
          ) : null}
        </DialogContent>
      </Dialog>

      <Card className="relative z-20 overflow-visible border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3 overflow-hidden rounded-t-xl border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Xuất nhập kho
          </CardTitle>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tạo mới
          </Button>
        </CardHeader>
        <CardContent className="overflow-visible space-y-4 p-4 sm:p-5">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="inv-tx-type"
              >
                Loại giao dịch
              </label>
              <div className="relative">
                <select
                  id="inv-tx-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={fieldSelect}
                >
                  {INVENTORY_TRANSACTION_TYPE_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="relative z-30 min-w-0 space-y-2 lg:col-span-5">
              <AdminVariantSearchPicker
                accessToken={accessToken}
                idPrefix="inv-filter"
                label="Biến thể"
                placeholder="Tất cả biến thể"
                value={variantId}
                onChange={setVariantId}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="inv-tx-from"
              >
                Từ ngày
              </label>
              <input
                id="inv-tx-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={fieldInput}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="inv-tx-to"
              >
                Đến ngày
              </label>
              <input
                id="inv-tx-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={fieldInput}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-12 lg:justify-end">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={loading || items.length === 0}
                onClick={() => downloadInventoryTransactionsCsv(items, page)}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Xuất CSV
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

      <Card className="relative z-10 overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Danh sách giao dịch</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              {loading
                ? "Đang đồng bộ dữ liệu…"
                : `${totalCount.toLocaleString("vi-VN")} bản ghi${
                    totalCount > 0 ? " — bấm một dòng để xem chi tiết." : "."
                  }`}
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
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3.5 pl-6 font-mono">ID</th>
                  <th className="px-4 py-3.5">Sản phẩm / biến thể</th>
                  <th className="px-4 py-3.5">Loại</th>
                  <th className="px-4 py-3.5 text-right">Số lượng</th>
                  <th className="px-4 py-3.5">Tham chiếu</th>
                  <th className="px-4 py-3.5 pr-6">Thời điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-600/70" />
                        <span className="text-sm font-medium">Đang tải dữ liệu…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có giao dịch phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi khoảng ngày hoặc bộ lọc.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const rowId = pickTx(row, "id", "Id");
                  const vId = pickTx(row, "variantId", "VariantId");
                  const qty = pickTx(row, "quantity", "Quantity");
                  const refT = pickTx(row, "referenceType", "ReferenceType");
                  const refI = pickTx(row, "referenceId", "ReferenceId");
                  const ts = pickTx(row, "timestamp", "Timestamp");
                  const txType = pickTx(row, "transactionType", "TransactionType");
                  const pName = pickTx(row, "productName", "ProductName");
                  const vName = pickTx(row, "variantName", "VariantName");
                  const vSku = pickTx(row, "variantSku", "VariantSku");
                  const canOpen = rowId != null && rowId !== "";
                  return (
                    <tr
                      key={rowId != null ? String(rowId) : `inv-tx-${idx}`}
                      onClick={() => canOpen && openDetail(rowId)}
                      className={cn(
                        canOpen && "cursor-pointer",
                        "transition-colors hover:bg-slate-500/[0.04] dark:hover:bg-slate-500/[0.06]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {rowId ?? "—"}
                      </td>
                      <td className="max-w-[320px] px-4 py-3.5 align-middle">
                        <div className="truncate font-medium text-slate-900 dark:text-slate-100" title={pName != null ? String(pName) : undefined}>
                          {pName != null && String(pName) !== "" ? String(pName) : "—"}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-400" title={vName != null ? String(vName) : undefined}>
                          {vName != null && String(vName) !== "" ? String(vName) : "—"}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                          SKU {vSku != null && String(vSku) !== "" ? String(vSku) : "—"} · #{vId ?? "—"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            inventoryTransactionTypeBadgeClass(txType != null ? String(txType) : "")
                          )}
                        >
                          {labelInventoryTransactionType(txType != null ? String(txType) : "")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle text-right font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {qty != null && Number.isFinite(Number(qty)) ? Number(qty).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="max-w-[220px] px-4 py-3.5 align-middle text-sm text-slate-800 dark:text-slate-200">
                        {refT ? (
                          <span
                            className={cn(
                              "inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              inventoryReferenceTypeBadgeClass(String(refT))
                            )}
                            title={String(refT)}
                          >
                            {labelInventoryReferenceType(String(refT))}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        <div className="mt-1 truncate font-mono text-xs text-slate-600 dark:text-slate-400" title={refI != null ? String(refI) : undefined}>
                          {refI != null && String(refI) !== "" ? String(refI) : "—"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 pr-6 align-middle text-xs text-slate-600 dark:text-slate-400">
                        {formatDateTime(ts != null ? String(ts) : "")}
                      </td>
                    </tr>
                  );
                })}
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
                  giao dịch
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
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm transition-transform active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950"
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
                className="h-9 gap-1 border-slate-200 bg-white shadow-sm transition-transform active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950"
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
