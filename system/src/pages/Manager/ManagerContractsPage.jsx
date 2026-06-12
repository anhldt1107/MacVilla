import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  adminContractStatusBadgeClass,
  createAdminContract,
  fetchAdminContractStatuses,
  fetchAdminContracts,
  labelAdminContractStatus,
} from "@/services/admin/adminContractsApi";
import { ChevronDown, ChevronLeft, ChevronRight, FileSignature, Filter, Loader2, Plus, RefreshCw } from "lucide-react";
import { DocumentUrlField } from "@/components/Admin/DocumentUrlField";
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
import {
  buildContractCreateValidity,
  formatContractDate,
  getContractValidityValidationError,
} from "@/lib/contractValidity";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const MANAGER_CONTRACTS_BASE = "/manager/sales/contracts";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);
const fieldSelect = cn(fieldInput, "cursor-pointer appearance-none bg-transparent pr-10");

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const STATUS_TABS = [
  { value: "", label: "Tất cả" },
  { value: "Draft", label: "Chờ xử lý (Draft)" },
  { value: "PendingConfirmation", label: "Chờ khách xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Active", label: "Đang hiệu lực" },
  { value: "Cancelled", label: "Đã hủy" },
];

/**
 * Manager — Hợp đồng (`/api/admin/contracts`) theo .
 * Manager tạo / gửi khách xác nhận / hủy. Sửa chỉ khi Draft.
 */
export function ManagerContractsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    quoteId: "",
    sendForCustomerConfirmation: true,
    validFrom: "",
    validTo: "",
    paymentTerms: "",
    attachmentUrl: "",
    notes: "",
  });

  useEffect(() => {
    const q = searchParams.get("quoteId");
    if (q && /^\d+$/.test(q)) {
      setQuoteId(q);
      setCreateForm((f) => ({ ...f, quoteId: q }));
    }
    const st = searchParams.get("status");
    if (st) setStatus(st);
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const opts = await fetchAdminContractStatuses(accessToken);
        if (!cancelled) setStatusOptions(opts.filter((o) => o.value));
      } catch {
        if (!cancelled) setStatusOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [status, customerId, quoteId, pageSize]);

  const statusFilterOptions = useMemo(() => {
    return [{ value: "", label: "Tất cả trạng thái" }, ...statusOptions];
  }, [statusOptions]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cid = customerId.trim() === "" ? undefined : Number(customerId);
      const qid = quoteId.trim() === "" ? undefined : Number(quoteId);
      const result = await fetchAdminContracts(accessToken, {
        page,
        pageSize,
        status: status || undefined,
        customerId: Number.isFinite(cid) && cid > 0 ? cid : undefined,
        quoteId: Number.isFinite(qid) && qid > 0 ? qid : undefined,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách hợp đồng.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, status, customerId, quoteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const createValidityError = useMemo(() => {
    if (!createForm.sendForCustomerConfirmation) return null;
    return getContractValidityValidationError(createForm.validFrom, createForm.validTo);
  }, [createForm.sendForCustomerConfirmation, createForm.validFrom, createForm.validTo]);

  const openCreate = () => {
    setCreateError("");
    setCreateForm((f) => ({
      ...f,
      quoteId: quoteId.trim() || f.quoteId || "",
    }));
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!accessToken) return;
    const qid = Number(String(createForm.quoteId).trim());
    if (!Number.isFinite(qid) || qid < 1) {
      setCreateError("Vui lòng nhập mã báo giá hợp lệ.");
      return;
    }
    if (createForm.sendForCustomerConfirmation) {
      const validityErr = getContractValidityValidationError(createForm.validFrom, createForm.validTo);
      if (validityErr) {
        setCreateError(validityErr);
        return;
      }
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      const created = await createAdminContract(accessToken, {
        quoteId: qid,
        sendForCustomerConfirmation: Boolean(createForm.sendForCustomerConfirmation),
        ...buildContractCreateValidity(createForm.validFrom, createForm.validTo),
        paymentTerms: createForm.paymentTerms.trim() || null,
        attachmentUrl: createForm.attachmentUrl.trim() || null,
        notes: createForm.notes.trim() || null,
      });
      setCreateOpen(false);
      const newId = created?.id ?? created?.Id;
      if (newId != null) {
        navigate(`${MANAGER_CONTRACTS_BASE}/${newId}`, { replace: false });
      } else {
        void load();
      }
    } catch (e) {
      setCreateError(
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tạo hợp đồng thất bại."
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const clearFilters = () => {
    setStatus("");
    setCustomerId("");
    setQuoteId("");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(status || customerId.trim() || quoteId.trim());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Hợp đồng — điều phối
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tạo, gửi khách xác nhận và hủy. Sửa chỉ khi hợp đồng ở trạng thái <span className="font-mono">Draft</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.value || "all"}
            type="button"
            variant={status === t.value ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setStatus(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden border-slate-200/80 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:shadow-none">
        <CardHeader className="space-y-1 border-b border-slate-100 bg-gradient-to-br from-teal-50/90 to-white pb-4 dark:border-slate-800 dark:from-teal-950/25 dark:to-slate-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300">
                <Filter className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">Bộ lọc hợp đồng</CardTitle>
              </div>
            </div>
            <Button type="button" size="sm" className="gap-1.5 self-start shadow-sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Tạo hợp đồng
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="mgr-contract-status">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="mgr-contract-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {statusFilterOptions.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="mgr-contract-customer">
                Mã khách hàng
              </label>
              <input
                id="mgr-contract-customer"
                type="number"
                min={1}
                placeholder="VD. 12"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={fieldInput}
              />
            </div>
            <div className="space-y-2 lg:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="mgr-contract-quote">
                Mã báo giá
              </label>
              <input
                id="mgr-contract-quote"
                type="number"
                min={1}
                placeholder="VD. 42"
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                className={fieldInput}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" className="gap-1.5 shadow-sm" onClick={() => void load()} disabled={loading}>
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

      <Card className="overflow-hidden border-slate-200/80 shadow-md dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-800 ring-1 ring-teal-500/20 dark:text-teal-300">
              <FileSignature className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                {loading ? "Danh sách hợp đồng" : `Danh sách hợp đồng · ${totalCount.toLocaleString("vi-VN")} hợp đồng`}
              </CardTitle>
            </div>
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
              Trang <span className="tabular-nums text-foreground">{page}</span> / {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3.5 pl-6">Số HĐ</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Báo giá</th>
                  <th className="px-4 py-3.5">Khách</th>
                  <th className="px-4 py-3.5">Tạo lúc</th>
                  <th className="px-4 py-3.5 pr-6">Hiệu lực</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600/70" aria-hidden />
                      <p className="mt-2 text-sm text-slate-500">Đang tải…</p>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-600">
                      Không có hợp đồng phù hợp.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const rid = row.id ?? row.Id;
                  const detailPath = rid != null ? `${MANAGER_CONTRACTS_BASE}/${rid}` : null;
                  const st = row.status ?? row.Status ?? "";
                  const num = row.contractNumber ?? row.ContractNumber ?? `#${rid}`;
                  const qid = row.quoteId ?? row.QuoteId;
                  const cid = row.customerId ?? row.CustomerId;
                  const cname = row.customerName ?? row.CustomerName;
                  const vf = row.validFrom ?? row.ValidFrom;
                  const vt = row.validTo ?? row.ValidTo;
                  const created = row.createdAt ?? row.CreatedAt;
                  return (
                    <tr
                      key={rid ?? idx}
                      className={cn(
                        detailPath && "cursor-pointer hover:bg-teal-500/[0.04] dark:hover:bg-teal-500/[0.07]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                      )}
                      onClick={() => detailPath && navigate(detailPath)}
                      onKeyDown={(e) => {
                        if (!detailPath) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(detailPath);
                        }
                      }}
                      tabIndex={detailPath ? 0 : undefined}
                      role={detailPath ? "button" : undefined}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 pl-6 align-middle">
                        {detailPath ? (
                          <Link
                            to={detailPath}
                            className="font-mono text-sm font-semibold text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {num}
                          </Link>
                        ) : (
                          <span className="font-mono text-sm font-semibold">{num}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            "inline-flex max-w-[14rem] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            adminContractStatusBadgeClass(st)
                          )}
                          title={st}
                        >
                          {labelAdminContractStatus(st, statusOptions)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs">
                        {qid != null ? (
                          <Link
                            to={`/manager/sales/quotations/${qid}`}
                            className="font-mono text-indigo-700 hover:underline dark:text-indigo-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{qid}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[200px] px-4 py-3.5 align-middle text-xs">
                        {cid != null ? (
                          <Link
                            to={`/manager/sales/customers/${cid}`}
                            className="truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {cname || `Khách #${cid}`}
                          </Link>
                        ) : (
                          (cname ?? "—")
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                        {formatDateTime(created)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 pr-6 align-middle text-xs text-slate-600 dark:text-slate-400">
                        {vf || vt ? (
                          <>
                            {formatContractDate(vf)} — {formatContractDate(vt)}
                          </>
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
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalCount > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
                  </span>{" "}
                  / {totalCount.toLocaleString("vi-VN")}
                </>
              ) : (
                "—"
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="min-w-[5rem] text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo hợp đồng từ báo giá</DialogTitle>
            <DialogDescription>
              Chỉ tạo được khi báo giá đã <strong>duyệt</strong> hoặc <strong>khách đã chấp nhận</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="mgr-cc-quote">
                Mã báo giá <span className="text-red-600">*</span>
              </label>
              <input
                id="mgr-cc-quote"
                type="number"
                min={1}
                className={fieldInput}
                value={createForm.quoteId}
                onChange={(e) => setCreateForm((f) => ({ ...f, quoteId: e.target.value }))}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={createForm.sendForCustomerConfirmation}
                onChange={(e) => setCreateForm((f) => ({ ...f, sendForCustomerConfirmation: e.target.checked }))}
              />
              <span>
                Gửi cho khách xác nhận ngay. Nếu không chọn, hợp đồng ở dạng <strong>nháp nội bộ</strong> để chỉnh tiếp trước khi gửi.
              </span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="mgr-cc-valid-from">
                  Hiệu lực từ
                </label>
                <input
                  id="mgr-cc-valid-from"
                  type="date"
                  className={fieldInput}
                  value={createForm.validFrom}
                  onChange={(e) => setCreateForm((f) => ({ ...f, validFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="mgr-cc-valid-to">
                  Hiệu lực đến
                </label>
                <input
                  id="mgr-cc-valid-to"
                  type="date"
                  className={fieldInput}
                  value={createForm.validTo}
                  onChange={(e) => setCreateForm((f) => ({ ...f, validTo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="mgr-cc-payment">
                Điều khoản thanh toán
              </label>
              <input
                id="mgr-cc-payment"
                className={fieldInput}
                value={createForm.paymentTerms}
                onChange={(e) => setCreateForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                placeholder="Ví dụ: Thanh toán trong 30 ngày…"
              />
            </div>
            <DocumentUrlField
              id="mgr-cc-attach"
              label="Tài liệu hợp đồng"
              value={createForm.attachmentUrl}
              onChange={(url) => setCreateForm((f) => ({ ...f, attachmentUrl: url }))}
              uploadFolder="contract"
              disabled={createSubmitting}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="mgr-cc-notes">
                Ghi chú
              </label>
              <textarea
                id="mgr-cc-notes"
                className={cn(fieldInput, "min-h-[72px] resize-y py-2")}
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ghi chú kèm hợp đồng (nếu có)…"
              />
            </div>
            {createError ? <p className="text-sm text-red-600 dark:text-red-400">{createError}</p> : null}
            {!createError && createValidityError ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">{createValidityError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createSubmitting}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void submitCreate()} disabled={createSubmitting || !!createValidityError}>
              {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
