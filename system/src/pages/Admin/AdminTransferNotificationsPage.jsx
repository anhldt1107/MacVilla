import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchAdminTransferNotificationStatuses,
  fetchAdminTransferNotifications,
  labelAdminTransferNotificationStatus,
  transferNotificationStatusBadgeClass,
} from "@/services/admin/adminTransferNotificationsApi";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldSelect = cn(fieldInput, "cursor-pointer appearance-none bg-transparent pr-10");

function pickRow(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

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
    return String(iso);
  }
}

export function AdminTransferNotificationsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("Pending");
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchAdminTransferNotificationStatuses(accessToken);
        if (!cancelled) setStatusOptions(Array.isArray(raw) ? raw : []);
      } catch {
        if (!cancelled) setStatusOptions(["Pending", "Verified", "Rejected"]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [status, customerId, fromDate, toDate, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cid = customerId.trim();
      const result = await fetchAdminTransferNotifications(accessToken, {
        page,
        pageSize,
        status: status || undefined,
        customerId: cid && /^\d+$/.test(cid) ? cid : undefined,
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách thông báo CK.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, status, customerId, fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setStatus("Pending");
    setCustomerId("");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    status !== "Pending" || Boolean(customerId.trim()) || Boolean(fromDate.trim()) || Boolean(toDate.trim());

  const statusFilterOptions = useMemo(() => {
    const base = statusOptions.length
      ? statusOptions.map((s) => ({ value: s, label: labelAdminTransferNotificationStatus(s) }))
      : [
          { value: "Pending", label: "Chờ đối soát" },
          { value: "Verified", label: "Đã xác nhận" },
          { value: "Rejected", label: "Đã từ chối" },
        ];
    return [{ value: "", label: "Tất cả trạng thái" }, ...base];
  }, [statusOptions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Thông báo chuyển khoản</h1>
        </div>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="grid gap-3 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="space-y-1.5 lg:col-span-3">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="tn-st">
              Trạng thái
            </label>
            <select id="tn-st" className={fieldSelect} value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusFilterOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="tn-cust">
              Khách (ID)
            </label>
            <input
              id="tn-cust"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="tn-from">
              Từ ngày
            </label>
            <input id="tn-from" type="date" className={fieldInput} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="tn-to">
              Đến ngày
            </label>
            <input id="tn-to" type="date" className={fieldInput} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
            <Button type="button" size="sm" className="gap-1.5 shadow-sm" disabled={loading} onClick={() => void load()}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Làm mới
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Danh sách · {totalCount.toLocaleString("vi-VN")} thông báo</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}/trang
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Trang {page}/{totalPages}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3 pl-6">Khách</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3">Mã tham chiếu</th>
                  <th className="px-4 py-3">Hóa đơn</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Gửi lúc</th>
                  <th className="px-4 py-3 pr-6">Chứng từ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600/70" />
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Không có thông báo phù hợp.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const o = /** @type {Record<string, unknown>} */ (row && typeof row === "object" ? row : {});
                  const rid = pickRow(o, "id", "Id");
                  const cname = pickRow(o, "customerName", "CustomerName");
                  const cid = pickRow(o, "customerId", "CustomerId");
                  const amt = pickRow(o, "amount", "Amount");
                  const refc = pickRow(o, "referenceCode", "ReferenceCode");
                  const invId = pickRow(o, "invoiceId", "InvoiceId");
                  const invNum = pickRow(o, "invoiceNumber", "InvoiceNumber");
                  const st = pickRow(o, "status", "Status");
                  const created = pickRow(o, "createdAt", "CreatedAt");
                  const att = pickRow(o, "attachmentUrl", "AttachmentUrl");
                  const dest = rid != null ? `${paths.transferNotificationsList}/${encodeURIComponent(String(rid))}` : "";
                  return (
                    <tr
                      key={rid != null ? String(rid) : idx}
                      tabIndex={rid != null ? 0 : undefined}
                      className={cn(
                        rid != null && "cursor-pointer hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/20"
                      )}
                      onClick={(e) => {
                        if (rid == null || !dest) return;
                        if (e.target instanceof Element && e.target.closest("a")) return;
                        navigate(dest);
                      }}
                      onKeyDown={(e) => {
                        if (rid == null || !dest) return;
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        navigate(dest);
                      }}
                    >
                      <td className="px-4 py-3 pl-6">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{cname != null ? String(cname) : "—"}</div>
                        {cid != null ? (
                          <Link
                            to={`${paths.sales}/customers/${encodeURIComponent(String(cid))}`}
                            className="font-mono text-xs text-violet-700 hover:underline dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{cid}
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{formatMoneyVnd(amt)}</td>
                      <td className="max-w-[180px] px-4 py-3 font-mono text-xs break-all">{refc != null ? String(refc) : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {invId != null ? (
                          <Link
                            to={`${paths.invoicesList}/${encodeURIComponent(String(invId))}`}
                            className="text-violet-700 hover:underline dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {invNum != null ? String(invNum) : `#${invId}`}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            transferNotificationStatusBadgeClass(st != null ? String(st) : "")
                          )}
                        >
                          {labelAdminTransferNotificationStatus(st != null ? String(st) : "")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {formatDateTime(created != null ? String(created) : "")}
                      </td>
                      <td className="px-4 py-3 pr-6">
                        {att != null && String(att).trim() ? (
                          <a
                            href={String(att)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Mở
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
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
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
