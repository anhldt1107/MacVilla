import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchAdminWarrantyClaims,
  fetchAdminWarrantyStatuses,
  labelAdminWarrantyClaimStatus,
} from "@/services/admin/adminWarrantyApi";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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

function formatMoneyVnd(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toLocaleString("vi-VN")} đ`;
}

/**
 * @param {{ warrantyBase: string; salesOrderBase: string; salesCustomerBase: string }} props
 */
export function WarrantyClaimsQueueShared({ warrantyBase, salesOrderBase, salesCustomerBase }) {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [warrantyTicketId, setWarrantyTicketId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [claimStatusOptions, setClaimStatusOptions] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const { claimStatuses } = await fetchAdminWarrantyStatuses(accessToken);
        if (!cancelled) {
          setClaimStatusOptions(claimStatuses.filter((o) => o.value));
        }
      } catch {
        if (!cancelled) setClaimStatusOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [onlyOpen, status, customerId, warrantyTicketId, orderId, fromDate, toDate, search, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cid = customerId.trim();
      const tid = warrantyTicketId.trim();
      const oid = orderId.trim();
      const result = await fetchAdminWarrantyClaims(accessToken, {
        page,
        pageSize,
        onlyOpen,
        status: status || undefined,
        customerId: cid && /^\d+$/.test(cid) ? cid : undefined,
        warrantyTicketId: tid && /^\d+$/.test(tid) ? tid : undefined,
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
            : "Không tải được danh sách yêu cầu bảo hành.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    isAuthenticated,
    page,
    pageSize,
    onlyOpen,
    status,
    customerId,
    warrantyTicketId,
    orderId,
    fromDate,
    toDate,
    search,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: "Mọi trạng thái (theo bộ lọc)" },
      ...claimStatusOptions.map((o) => ({
        value: o.value,
        label: labelAdminWarrantyClaimStatus(o.value, claimStatusOptions),
      })),
    ],
    [claimStatusOptions]
  );

  const claimDetailPath = (claimId) => `${warrantyBase}/claims/${encodeURIComponent(String(claimId))}`;
  const ticketPath = (ticketId) => `${warrantyBase}/${encodeURIComponent(String(ticketId))}`;
  const orderPath = (oid) => `${salesOrderBase}/${encodeURIComponent(String(oid))}`;
  const customerPath = (custId) => `${salesCustomerBase}/${encodeURIComponent(String(custId))}`;

  const applySearch = () => {
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <Link to={warrantyBase} className="text-violet-700 hover:underline dark:text-violet-400">
              Phiếu bảo hành
            </Link>
            <span aria-hidden> · </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">Hàng đợi claim</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Yêu cầu bảo hành</h1>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start sm:self-center" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
          Tải lại
        </Button>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40 sm:col-span-2 lg:col-span-1">
            <input type="checkbox" className="size-4 rounded border-slate-300" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Chỉ claim chưa kết thúc</span>
          </label>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="wcq-st">
              Trạng thái claim
            </label>
            <select id="wcq-st" className={fieldSelect} value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusFilterOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="wcq-cust">
              Khách (ID)
            </label>
            <input
              id="wcq-cust"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="wcq-ticket">
              Phiếu BH (ID)
            </label>
            <input
              id="wcq-ticket"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={warrantyTicketId}
              onChange={(e) => setWarrantyTicketId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="wcq-ord">
              Đơn (ID)
            </label>
            <input id="wcq-ord" type="text" inputMode="numeric" className={fieldInput} value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="wcq-from">
              Từ ngày (tạo claim)
            </label>
            <input id="wcq-from" type="date" className={fieldInput} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="wcq-to">
              Đến ngày
            </label>
            <input id="wcq-to" type="date" className={fieldInput} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="wcq-search">
              Tìm kiếm
            </label>
            <div className="flex gap-2">
              <input
                id="wcq-search"
                type="search"
                className={fieldInput}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
                placeholder="Mã phiếu, SKU, mô tả, đơn, tên khách…"
              />
              <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={applySearch}>
                Lọc
              </Button>
            </div>
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
            <CardTitle className="text-base">Danh sách claim · {totalCount.toLocaleString("vi-VN")} bản ghi</CardTitle>
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
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3 pl-6">Claim</th>
                  <th className="px-4 py-3">Phiếu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Đơn</th>
                  <th className="px-4 py-3">Sản phẩm / SKU</th>
                  <th className="px-4 py-3 text-right">Dự kiến</th>
                  <th className="px-4 py-3">Tạo</th>
                  <th className="max-w-[200px] px-4 py-3 pr-6">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600/70" />
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      Không có yêu cầu phù hợp.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const rid = pickRow(row, "id", "Id");
                  const ticketId = pickRow(row, "warrantyTicketId", "WarrantyTicketId");
                  const ticketNum = pickRow(row, "ticketNumber", "TicketNumber");
                  const st = pickRow(row, "status", "Status");
                  const cname = pickRow(row, "customerName", "CustomerName");
                  const cid = pickRow(row, "customerId", "CustomerId");
                  const oid = pickRow(row, "orderId", "OrderId");
                  const ocode = pickRow(row, "orderCode", "OrderCode");
                  const orderItemId = pickRow(row, "orderItemId", "OrderItemId");
                  const sku = pickRow(row, "sku", "Sku");
                  const lineValidUntil = pickRow(row, "lineValidUntil", "LineValidUntil");
                  const pname = pickRow(row, "productName", "ProductName");
                  const vname = pickRow(row, "variantName", "VariantName");
                  const created = pickRow(row, "createdAt", "CreatedAt");
                  const cost = pickRow(row, "estimatedCost", "EstimatedCost");
                  const desc = pickRow(row, "defectDescription", "DefectDescription");
                  const dest = rid != null ? claimDetailPath(rid) : "";
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
                      aria-label={rid != null ? `Mở yêu cầu bảo hành ${rid}` : undefined}
                    >
                      <td className="px-4 py-3 pl-6 font-mono text-xs font-semibold">
                        {rid != null ? (
                          <Link className="text-violet-700 hover:underline dark:text-violet-400" to={dest} onClick={(e) => e.stopPropagation()}>
                            #{rid}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {ticketId != null ? (
                          <Link
                            className="text-violet-700 hover:underline dark:text-violet-400"
                            to={ticketPath(ticketId)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ticketNum != null ? String(ticketNum) : `#${ticketId}`}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{labelAdminWarrantyClaimStatus(st != null ? String(st) : "", claimStatusOptions)}</td>
                      <td className="max-w-[180px] px-4 py-3">
                        <div className="truncate font-medium text-slate-900 dark:text-slate-100">{cname != null ? String(cname) : "—"}</div>
                        {cid != null ? (
                          <Link
                            to={customerPath(cid)}
                            className="font-mono text-[11px] text-violet-700 hover:underline dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{cid}
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {oid != null ? (
                          <Link className="text-violet-700 hover:underline dark:text-violet-400" to={orderPath(oid)} onClick={(e) => e.stopPropagation()}>
                            {ocode != null ? String(ocode) : `#${oid}`}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                        <div className="truncate font-medium" title={pname != null ? String(pname) : ""}>
                          {pname != null ? String(pname) : "—"}
                        </div>
                        <div className="truncate font-mono text-[11px] text-slate-500" title={sku != null ? String(sku) : ""}>
                          {[sku != null ? String(sku) : "", vname != null ? String(vname) : ""].filter(Boolean).join(" · ") || "—"}
                        </div>
                        {orderItemId != null || lineValidUntil != null ? (
                          <div className="truncate text-[10px] text-slate-400">
                            {orderItemId != null ? `Dòng #${orderItemId}` : ""}
                            {orderItemId != null && lineValidUntil != null ? " · " : ""}
                            {lineValidUntil != null ? `BH đến ${formatDate(String(lineValidUntil))}` : ""}
                          </div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums">{formatMoneyVnd(cost)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{formatDate(created != null ? String(created) : "")}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 pr-6 text-xs text-slate-600 dark:text-slate-400" title={desc != null ? String(desc) : ""}>
                        {desc != null ? String(desc) : "—"}
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
