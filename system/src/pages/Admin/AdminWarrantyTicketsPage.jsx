import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchAdminWarrantyStatuses,
  fetchAdminWarrantyTicketByNumber,
  fetchAdminWarrantyTickets,
  labelAdminWarrantyTicketStatus,
  warrantyTicketStatusBadgeClass,
} from "@/services/admin/adminWarrantyApi";
import { WarrantyTicketCreateDialog } from "@/components/warranty/WarrantyTicketCreateDialog";
import { ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, Search } from "lucide-react";
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

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(iso);
  }
}

export function AdminWarrantyTicketsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paths = useStaffShellPaths();
  const warrantyBase = paths.warrantyTicketsList;
  const { accessToken, isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [ticketStatusOptions, setTicketStatusOptions] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);

  const [lookupSubmitting, setLookupSubmitting] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const oid = searchParams.get("orderId");
    if (oid && /^\d+$/.test(oid)) setOrderId(oid);
    const cid = searchParams.get("customerId");
    if (cid && /^\d+$/.test(cid)) setCustomerId(cid);
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const { ticketStatuses } = await fetchAdminWarrantyStatuses(accessToken);
        if (!cancelled) setTicketStatusOptions(ticketStatuses.filter((o) => o.value));
      } catch {
        if (!cancelled) setTicketStatusOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [status, customerId, orderId, fromDate, toDate, search, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cid = customerId.trim();
      const oid = orderId.trim();
      const result = await fetchAdminWarrantyTickets(accessToken, {
        page,
        pageSize,
        status: status || undefined,
        customerId: cid && /^\d+$/.test(cid) ? cid : undefined,
        orderId: oid && /^\d+$/.test(oid) ? oid : undefined,
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
        search: search.trim() || undefined,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách phiếu bảo hành.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, status, customerId, orderId, fromDate, toDate, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: "Tất cả trạng thái" },
      ...ticketStatusOptions.map((o) => ({
        value: o.value,
        label: labelAdminWarrantyTicketStatus(o.value, ticketStatusOptions),
      })),
    ],
    [ticketStatusOptions]
  );

  const clearFilters = () => {
    setStatus("");
    setCustomerId("");
    setOrderId("");
    setFromDate("");
    setToDate("");
    setSearchInput("");
    setSearch("");
  };

  const hasActiveFilters = Boolean(
    status || customerId.trim() || orderId.trim() || fromDate || toDate || searchInput.trim()
  );

  const createDialogSeed = useMemo(() => {
    const c = customerId.trim();
    const o = orderId.trim();
    return {
      customerId: c && /^\d+$/.test(c) ? c : "",
      orderId: o && /^\d+$/.test(o) ? o : "",
    };
  }, [customerId, orderId]);

  const lookupByNumber = async () => {
    if (!accessToken) return;
    const q = searchInput.trim();
    if (!q) {
      setLookupError("Nhập mã phiếu (số phiếu).");
      return;
    }
    setLookupSubmitting(true);
    setLookupError("");
    try {
      const d = await fetchAdminWarrantyTicketByNumber(accessToken, q);
      const raw = d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : {};
      const tid = raw.id ?? raw.Id;
      if (tid != null && Number.isFinite(Number(tid))) {
        navigate(`${warrantyBase}/${Number(tid)}`);
      } else {
        setLookupError("Không tìm thấy phiếu với mã này.");
      }
    } catch (e) {
      setLookupError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tra cứu thất bại.");
    } finally {
      setLookupSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <WarrantyTicketCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        warrantyBasePath={warrantyBase}
        onSuccess={load}
        openSeed={createDialogSeed}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Phiếu bảo hành</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Tạo phiếu
          </Button>
        </div>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="grid gap-3 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="w-f-st">
              Trạng thái
            </label>
            <select id="w-f-st" className={fieldSelect} value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusFilterOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="w-f-cust">
              Khách (ID)
            </label>
            <input
              id="w-f-cust"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="w-f-ord">
              Đơn (ID)
            </label>
            <input
              id="w-f-ord"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="w-f-from">
              Từ ngày
            </label>
            <input id="w-f-from" type="date" className={fieldInput} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="w-f-to">
              Đến ngày
            </label>
            <input id="w-f-to" type="date" className={fieldInput} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="w-f-q">
              Tìm kiếm / mã phiếu
            </label>
            <div className="flex gap-2">
              <input
                id="w-f-q"
                type="search"
                className={fieldInput}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="SĐT, tên, mã phiếu…"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 gap-1"
                disabled={lookupSubmitting}
                onClick={() => void lookupByNumber()}
                title="Tra cứu theo số phiếu"
              >
                {lookupSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
                Tra mã
              </Button>
            </div>
            {lookupError ? <p className="text-xs text-red-600 dark:text-red-400">{lookupError}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-12 lg:justify-end">
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
            <CardTitle className="text-base">Danh sách phiếu · {totalCount.toLocaleString("vi-VN")} phiếu</CardTitle>
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
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3 pl-6">Mã phiếu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Đơn</th>
                  <th className="px-4 py-3">Hiệu lực đến</th>
                  <th className="px-4 py-3 pr-6">Tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600/70" />
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Không có phiếu phù hợp.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const rid = pickRow(row, "id", "Id");
                  const num = pickRow(row, "ticketNumber", "TicketNumber");
                  const st = pickRow(row, "status", "Status");
                  const cname = pickRow(row, "customerName", "CustomerName");
                  const cid = pickRow(row, "customerId", "CustomerId");
                  const oid = pickRow(row, "orderId", "OrderId");
                  const until = pickRow(row, "validUntil", "ValidUntil");
                  const created = pickRow(row, "createdAt", "CreatedAt");
                  return (
                    <tr
                      key={rid != null ? String(rid) : idx}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/20"
                      )}
                      onClick={() => rid != null && navigate(`${warrantyBase}/${encodeURIComponent(String(rid))}`)}
                    >
                      <td className="px-4 py-3 pl-6 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {num != null ? String(num) : rid != null ? `#${rid}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            warrantyTicketStatusBadgeClass(st != null ? String(st) : "")
                          )}
                        >
                          {labelAdminWarrantyTicketStatus(st != null ? String(st) : "", ticketStatusOptions)}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {cname != null ? String(cname) : "—"}
                        </div>
                        {cid != null ? <div className="font-mono text-[11px] text-slate-500">#{cid}</div> : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {oid != null ? (
                          <Link
                            to={`/admin/sales/orders/${encodeURIComponent(String(oid))}`}
                            className="text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{oid}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(until != null ? String(until) : "")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 pr-6 text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(created != null ? String(created) : "")}
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
        </CardContent>
      </Card>
    </div>
  );
}
