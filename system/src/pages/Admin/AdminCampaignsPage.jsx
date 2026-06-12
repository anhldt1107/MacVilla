import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  CAMPAIGN_CREATE_STATUS_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
  createAdminCampaign,
  fetchAdminCampaigns,
} from "@/services/admin/adminCampaignsApi";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, Target } from "lucide-react";
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

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldSelect = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "cursor-pointer appearance-none bg-transparent pr-10",
  "hover:border-slate-300 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultCreateDateRangeLocal() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end) };
}

function datetimeLocalToIso(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
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
    });
  } catch {
    return iso;
  }
}

function campaignStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "active") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/50";
  }
  if (s === "inactive") {
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  }
  if (s === "expired") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/55";
  }
  return "bg-violet-50 text-violet-950 ring-1 ring-violet-200/80 dark:bg-violet-950/35 dark:text-violet-100 dark:ring-violet-800/50";
}

function labelCampaignStatus(status) {
  const hit = CAMPAIGN_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status;
}

export function AdminCampaignsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [listTick, setListTick] = useState(0);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStartLocal, setCreateStartLocal] = useState("");
  const [createEndLocal, setCreateEndLocal] = useState("");
  const [createStatus, setCreateStatus] = useState("Active");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [status, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminCampaigns(accessToken, {
        page,
        pageSize,
        status,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách chiến dịch.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, page, pageSize, status, listTick]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const clearFilters = () => {
    setStatus("");
  };

  const hasActiveFilters = Boolean(status);

  const openCampaignDetail = useCallback(
    (campaignId) => {
      navigate(`/admin/marketing/campaigns/${campaignId}`);
    },
    [navigate]
  );

  const openCreateCampaignDialog = useCallback(() => {
    const { start, end } = defaultCreateDateRangeLocal();
    setCreateName("");
    setCreateDescription("");
    setCreateStartLocal(start);
    setCreateEndLocal(end);
    setCreateStatus("Active");
    setCreateError("");
    setCreateDialogOpen(true);
  }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setCreateError("");
    const name = createName.trim();
    const desc = createDescription.trim();
    if (!name) {
      setCreateError("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (!createStartLocal || !createEndLocal) {
      setCreateError("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }
    const startIso = datetimeLocalToIso(createStartLocal);
    const endIso = datetimeLocalToIso(createEndLocal);
    if (!startIso || !endIso) {
      setCreateError("Thời gian không hợp lệ.");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setCreateError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    if (!accessToken) return;

    setCreateSubmitting(true);
    try {
      await createAdminCampaign(accessToken, {
        name,
        description: desc || name,
        startDate: startIso,
        endDate: endIso,
        status: createStatus,
      });
      setCreateDialogOpen(false);
      setPage(1);
      setStatus("");
      setListTick((t) => t + 1);
    } catch (err) {
      setCreateError(
        err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : "Tạo chiến dịch thất bại."
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateError("");
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo chiến dịch mới</DialogTitle>
            <DialogDescription>
              Nhập tên, mô tả, khoảng thời gian và trạng thái ban đầu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="campaign-create-name">
                Tên chiến dịch
              </label>
              <input
                id="campaign-create-name"
                type="text"
                placeholder="Ví dụ: Chiến dịch 30/4 - 1/5"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className={fieldInput}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="campaign-create-desc">
                Mô tả
              </label>
              <textarea
                id="campaign-create-desc"
                rows={3}
                placeholder="Mô tả ngắn cho đội vận hành…"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className={cn(
                  fieldInput,
                  "min-h-[5rem] resize-y py-2.5"
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="campaign-create-start">
                  Bắt đầu
                </label>
                <input
                  id="campaign-create-start"
                  type="datetime-local"
                  value={createStartLocal}
                  onChange={(e) => setCreateStartLocal(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="campaign-create-end">
                  Kết thúc
                </label>
                <input
                  id="campaign-create-end"
                  type="datetime-local"
                  value={createEndLocal}
                  onChange={(e) => setCreateEndLocal(e.target.value)}
                  className={fieldInput}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="campaign-create-status">
                Trạng thái ban đầu
              </label>
              <div className="relative">
                <select
                  id="campaign-create-status"
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {CAMPAIGN_CREATE_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            {createError ? (
              <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                {createError}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createSubmitting}>
                Hủy
              </Button>
              <Button type="submit" className="transition-transform active:scale-[0.98]" disabled={createSubmitting}>
                {createSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo…
                  </>
                ) : (
                  "Tạo chiến dịch"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Chiến dịch khuyến mãi
          </CardTitle>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-2 shadow-sm transition-transform active:scale-[0.98]"
            onClick={openCreateCampaignDialog}
          >
            <Plus className="h-4 w-4" />
            Tạo chiến dịch
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-8">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="admin-campaign-status"
              >
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="admin-campaign-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldSelect}
                >
                  {CAMPAIGN_STATUS_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:col-span-4 lg:justify-end">
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
            <CardTitle className="text-lg font-semibold tracking-tight">Danh sách chiến dịch</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              {loading
                ? "Đang đồng bộ dữ liệu…"
                : `${totalCount.toLocaleString("vi-VN")} chiến dịch — nhấn một dòng để xem chi tiết và danh sách voucher.`}
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
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-5 py-3.5 pl-6 font-mono">ID</th>
                  <th className="px-5 py-3.5">Tên chiến dịch</th>
                  <th className="px-5 py-3.5">Mô tả</th>
                  <th className="px-5 py-3.5">Bắt đầu</th>
                  <th className="px-5 py-3.5">Kết thúc</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 pr-6 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600/70" />
                        <span className="text-sm font-medium">Đang tải dữ liệu…</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Không có chiến dịch phù hợp</p>
                      <p className="mt-1 text-xs text-slate-500">Thử đổi bộ lọc trạng thái hoặc làm mới danh sách.</p>
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Xem chi tiết ${row.name}`}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                      idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                    )}
                    onClick={() => openCampaignDetail(row.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        openCampaignDetail(row.id);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 pl-6 align-middle font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {row.id}
                    </td>
                    <td className="max-w-[220px] px-5 py-3.5 align-middle">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</span>
                    </td>
                    <td className="max-w-[280px] px-5 py-3.5 align-middle">
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {row.description?.trim() || "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.startDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.endDate)}
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          campaignStatusBadgeClass(row.status)
                        )}
                      >
                        {labelCampaignStatus(row.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 pr-6 text-right align-middle font-mono text-sm tabular-nums text-slate-800 dark:text-slate-200">
                      {(row.voucherCount ?? 0).toLocaleString("vi-VN")}
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
                  chiến dịch
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
