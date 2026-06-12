import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { QuoteConvertToOrderDialog } from "@/components/Admin/quotes/QuoteConvertToOrderDialog";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { ROLE_ALIASES } from "@/config/roleRoutes.config";
import { fetchAdminUserRoles, fetchAdminUsers } from "@/services/admin/adminUsersApi";
import {
  adminQuoteStatusBadgeClass,
  approveAdminQuote,
  assignAdminQuoteSales,
  fetchAdminQuoteDetail,
  formatQuoteDiscount,
  labelAdminQuoteStatus,
  rejectAdminQuote,
  returnAdminQuoteToDraft,
} from "@/services/admin/adminQuotesApi";
import { QuoteNotesHistorySection } from "@/components/Admin/quotes/QuoteNotesHistorySection";
import { AlertTriangle, BadgeCheck, ChevronRight, FileSpreadsheet, Loader2, Search, ShoppingCart, Undo2, UserPlus, XCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";

const QUOTES_LIST = "/manager/sales/quotations";
const QUOTES_PENDING = "/manager/sales/quotations/pending";

/** @param {{ id: number; roleName: string }[]} roles */
function findSalerRoleInList(roles) {
  const salerNames = new Set(
    Object.entries(ROLE_ALIASES)
      .filter(([, bucket]) => bucket === "saler")
      .map(([name]) => name.toLowerCase())
  );
  return roles.find((r) => salerNames.has(String(r.roleName || "").trim().toLowerCase()));
}

function isQuoteSalesUnassigned(quote) {
  if (!quote) return false;
  const s = quote.sales;
  return s == null || s.id == null;
}

const assignSearchInputClass = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pl-10 text-sm text-foreground shadow-sm",
  "placeholder:text-slate-400 focus-visible:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20",
  "dark:border-slate-700 dark:bg-slate-950"
);

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

const rejectReasonClass = cn(
  "min-h-[100px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-foreground shadow-sm",
  "placeholder:text-slate-400 focus-visible:border-red-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/15",
  "dark:border-slate-700 dark:bg-slate-950"
);

/**
 * Chi tiết báo giá (Manager) — duyệt / từ chối / tinh chỉnh báo giá —
 */
export function ManagerQuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const paths = useStaffShellPaths();
  const { accessToken, isAuthenticated } = useAuth();
  const [convertOpen, setConvertOpen] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [approveLoading, setApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSalerRoleId, setAssignSalerRoleId] = useState(null);
  const [assignRoleLoading, setAssignRoleLoading] = useState(false);
  const [assignRoleError, setAssignRoleError] = useState("");
  const [assignPickLoading, setAssignPickLoading] = useState(false);
  const [assignPickError, setAssignPickError] = useState("");
  const [assignItems, setAssignItems] = useState([]);
  const [assignSubmittingId, setAssignSubmittingId] = useState(null);
  const [assignActionError, setAssignActionError] = useState("");

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const d = await fetchAdminQuoteDetail(accessToken, id);
      setQuote(d);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải được báo giá.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAssignDialog = () => {
    setAssignSearch("");
    setAssignPickError("");
    setAssignRoleError("");
    setAssignSalerRoleId(null);
    setAssignActionError("");
    setAssignItems([]);
    setAssignOpen(true);
  };

  const onAssignDialogOpenChange = (open) => {
    setAssignOpen(open);
    if (!open) {
      setAssignSearch("");
      setAssignPickError("");
      setAssignRoleError("");
      setAssignSalerRoleId(null);
      setAssignRoleLoading(false);
      setAssignActionError("");
      setAssignItems([]);
    }
  };

  useEffect(() => {
    if (!assignOpen || !isAuthenticated || !accessToken) return;

    let cancelled = false;
    (async () => {
      setAssignRoleLoading(true);
      setAssignRoleError("");
      setAssignSalerRoleId(null);
      try {
        const roles = await fetchAdminUserRoles(accessToken);
        if (cancelled) return;
        const hit = findSalerRoleInList(roles);
        if (!hit) {
          setAssignRoleError("Chưa cấu hình nhân viên kinh doanh. Liên hệ quản trị.");
          return;
        }
        setAssignSalerRoleId(hit.id);
      } catch (e) {
        if (cancelled) return;
        setAssignRoleError(
          e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải được danh sách vai trò."
        );
      } finally {
        if (!cancelled) setAssignRoleLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assignOpen, accessToken, isAuthenticated]);

  useEffect(() => {
    if (!assignOpen || !isAuthenticated || !accessToken || assignSalerRoleId == null) {
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      (async () => {
        setAssignPickLoading(true);
        setAssignPickError("");
        try {
          const res = await fetchAdminUsers(accessToken, {
            page: 1,
            pageSize: 80,
            search: assignSearch.trim() || undefined,
            status: "Active",
            roleId: assignSalerRoleId,
          });
          if (cancelled) return;
          setAssignItems(res.items ?? []);
        } catch (e) {
          if (cancelled) return;
          setAssignPickError(
            e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải được danh sách saler."
          );
          setAssignItems([]);
        } finally {
          if (!cancelled) setAssignPickLoading(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [assignOpen, assignSearch, accessToken, isAuthenticated, assignSalerRoleId]);

  const handleAssignPick = async (userId) => {
    if (!accessToken || !id || assignSubmittingId != null) return;
    setAssignSubmittingId(userId);
    setAssignActionError("");
    try {
      const updated = await assignAdminQuoteSales(accessToken, id, { salesId: userId });
      setQuote(updated);
      setAssignOpen(false);
    } catch (e) {
      setAssignActionError(
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Gán sale thất bại."
      );
    } finally {
      setAssignSubmittingId(null);
    }
  };

  const assignListBusy = assignRoleLoading || assignPickLoading;
  const assignListErr = assignRoleError || assignPickError;

  const lines = quote?.lines ?? [];

  const pricingWarnings = useMemo(() => {
    const w = [];
    for (const line of lines) {
      const retail = line.currentRetailPrice;
      const up = line.unitPrice;
      if (retail != null && up != null && Number(up) < Number(retail)) {
        w.push({
          name: line.productName ?? `Dòng #${line.id}`,
          sku: line.currentSku,
          unitPrice: up,
          retail,
        });
      }
    }
    return w;
  }, [lines]);

  const isPending = quote?.status === "PendingApproval";
  const canReturnToDraft =
    quote && ["PendingApproval", "Rejected", "CounterOffer"].includes(String(quote.status));

  const handleApprove = async () => {
    if (!accessToken || !id || !isPending || approveLoading) return;
    setApproveLoading(true);
    setApproveError("");
    try {
      const updated = await approveAdminQuote(accessToken, id);
      setQuote(updated);
    } catch (e) {
      setApproveError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Duyệt thất bại.");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!accessToken || !id || rejectSubmitting) return;
    const r = rejectReason.trim();
    if (!r) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }
    setRejectSubmitting(true);
    setRejectError("");
    try {
      const updated = await rejectAdminQuote(accessToken, id, { rejectReason: r });
      setQuote(updated);
      setRejectOpen(false);
      setRejectReason("");
    } catch (e) {
      setRejectError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Từ chối thất bại.");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleReturnToDraft = async () => {
    if (!accessToken || !id || returnSubmitting) return;
    setReturnSubmitting(true);
    setReturnError("");
    try {
      const updated = await returnAdminQuoteToDraft(accessToken, id);
      setQuote(updated);
      setReturnOpen(false);
    } catch (e) {
      setReturnError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Thao tác thất bại.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/manager" className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={QUOTES_LIST} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Báo giá
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={QUOTES_PENDING} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Chờ duyệt
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="px-1.5 font-semibold text-slate-800 dark:text-slate-200">{quote?.quoteCode ?? `#${id}`}</span>
      </nav>

      <Dialog open={rejectOpen} onOpenChange={(o) => { setRejectOpen(o); if (!o) setRejectError(""); }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => rejectSubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Từ chối báo giá</DialogTitle>
            <DialogDescription>Nhập lý do từ chối báo giá.</DialogDescription>
          </DialogHeader>
          <textarea
            className={rejectReasonClass}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={rejectSubmitting}
            placeholder="Ví dụ: Giá vượt ngưỡng duyệt tháng này"
          />
          {rejectError ? <p className="text-sm text-red-600 dark:text-red-400">{rejectError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={rejectSubmitting} onClick={() => setRejectOpen(false)}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" disabled={rejectSubmitting} onClick={() => void handleReject()}>
              {rejectSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnOpen} onOpenChange={(o) => { setReturnOpen(o); if (!o) setReturnError(""); }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => returnSubmitting && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Tinh chỉnh báo giá</DialogTitle>
            <DialogDescription>
              Báo giá sẽ chuyển về nháp để Sale cập nhật nội dung và gửi lại quy trình duyệt.
            </DialogDescription>
          </DialogHeader>
          {returnError ? <p className="text-sm text-red-600 dark:text-red-400">{returnError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={returnSubmitting} onClick={() => setReturnOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={returnSubmitting} onClick={() => void handleReturnToDraft()}>
              {returnSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={onAssignDialogOpenChange}>
        <DialogContent className="max-h-[min(90vh,560px)] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left dark:border-slate-800">
            <DialogTitle className="text-base">Gán / đổi nhân viên sale</DialogTitle>
            <DialogDescription>
              {isQuoteSalesUnassigned(quote)
                ? "Chỉ tài khoản vai trò Saler đang hoạt động. Gõ để lọc — chọn một người để tiếp nhận báo giá."
                : "Chọn nhân viên bán hàng khác để thay người phụ trách. Chỉ tài khoản đang hoạt động; gõ để lọc theo tên, SĐT hoặc email."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-2 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                className={assignSearchInputClass}
                placeholder="Tìm trong danh sách saler…"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                autoComplete="off"
                aria-label="Tìm saler"
              />
            </div>
          </div>
          <div className="max-h-[min(50vh,320px)] overflow-y-auto border-t border-slate-100 px-2 py-2 dark:border-slate-800">
            {assignListBusy ? (
              <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600/70" aria-hidden />
                <span className="text-sm">{assignRoleLoading ? "Đang xác định vai trò Saler…" : "Đang tải danh sách saler…"}</span>
              </div>
            ) : null}
            {!assignListBusy && assignListErr ? (
              <p className="px-3 py-6 text-center text-sm text-red-600 dark:text-red-400">{assignListErr}</p>
            ) : null}
            {!assignListBusy && !assignListErr && assignSalerRoleId != null && assignItems.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">Không có saler phù hợp.</p>
            ) : null}
            {!assignListBusy && !assignListErr && assignItems.length > 0
              ? assignItems.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={assignSubmittingId != null}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      "hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
                      "disabled:pointer-events-none disabled:opacity-50"
                    )}
                    onClick={() => void handleAssignPick(u.id)}
                  >
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{u.fullName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {u.roleName}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </span>
                    {u.email ? (
                      <span className="max-w-full truncate text-xs text-slate-500 dark:text-slate-500">{u.email}</span>
                    ) : null}
                    {assignSubmittingId === u.id ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        Đang gán…
                      </span>
                    ) : null}
                  </button>
                ))
              : null}
          </div>
          {assignActionError ? (
            <div className="border-t border-red-100 bg-red-50/80 px-5 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {assignActionError}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {loading && !quote ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600/70" aria-hidden />
        </div>
      ) : null}

      {error && !loading ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error && quote ? (
        <>
          <header className="border-b border-slate-200/90 pb-8 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-800 ring-1 ring-violet-500/20 dark:text-violet-300">
                    <FileSpreadsheet className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <h1 className="font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">{quote.quoteCode}</h1>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      adminQuoteStatusBadgeClass(quote.status)
                    )}
                  >
                    {labelAdminQuoteStatus(quote.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tạo / cập nhật: <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(quote.createdAt)}</span>
                  {quote.validUntil ? (
                    <>
                      {" "}
                      · Hiệu lực đến{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(quote.validUntil)}</span>
                    </>
                  ) : null}
                </p>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <Button
                    type="button"
                    size="sm"
                    className="w-fit gap-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
                    disabled={!isPending || approveLoading}
                    title={!isPending ? "Chỉ duyệt khi trạng thái là Chờ duyệt" : undefined}
                    onClick={() => void handleApprove()}
                  >
                    {approveLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <BadgeCheck className="h-4 w-4" aria-hidden />}
                    Duyệt báo giá
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit gap-1.5 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                    disabled={!isPending || approveLoading || rejectSubmitting}
                    title={!isPending ? "Chỉ từ chối khi trạng thái là Chờ duyệt" : undefined}
                    onClick={() => {
                      setRejectError("");
                      setRejectOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                    Từ chối
                  </Button>
                  {canReturnToDraft ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-fit gap-1.5"
                      disabled={returnSubmitting}
                      onClick={() => {
                        setReturnError("");
                        setReturnOpen(true);
                      }}
                    >
                      <Undo2 className="h-4 w-4" aria-hidden />
                      Tinh chỉnh báo giá
                    </Button>
                  ) : null}
                  {quote.status === "CustomerAccepted" ? (
                    <Button
                      type="button"
                      size="sm"
                      className="w-fit gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      onClick={() => setConvertOpen(true)}
                    >
                      <ShoppingCart className="h-4 w-4" aria-hidden />
                      Chuyển thành đơn hàng
                    </Button>
                  ) : null}
                </div>
                {approveError ? <p className="text-sm text-red-600 dark:text-red-400">{approveError}</p> : null}
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-right dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sau giảm</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoneyVnd(quote.finalAmount)}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Tổng {formatMoneyVnd(quote.totalAmount)}
                  {quote.discountValue != null ? (
                    <>
                      {" "}
                      · Giảm {formatQuoteDiscount(quote.discountType, quote.discountValue)}
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </header>

          {pricingWarnings.length > 0 ? (
            <div className="flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div>
                <p className="font-semibold">Cảnh báo giá</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                  {pricingWarnings.map((w, i) => (
                    <li key={i}>
                      <span className="font-medium">{w.name}</span>
                      {w.sku ? <span className="font-mono text-amber-900/80 dark:text-amber-200/90"> ({w.sku})</span> : null}: đơn giá báo{" "}
                      <span className="font-mono">{formatMoneyVnd(w.unitPrice)}</span> thấp hơn giá bán lẻ hiện tại{" "}
                      <span className="font-mono">{formatMoneyVnd(w.retail)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-slate-200/80 lg:col-span-1 dark:border-slate-800">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-base">Sales soạn</CardTitle>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  onClick={() => openAssignDialog()}
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {isQuoteSalesUnassigned(quote) ? "Tiếp nhận báo giá" : "Đổi nhân viên sale"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-slate-900 dark:text-slate-100">{quote.sales?.fullName ?? "—"}</p>
                {quote.sales?.email ? <p className="text-slate-600 dark:text-slate-400">{quote.sales.email}</p> : null}
                {quote.sales?.phone ? <p className="text-slate-600 dark:text-slate-400">{quote.sales.phone}</p> : null}
                <p className="pt-2 text-xs text-slate-500">
                  Thời điểm bản ghi: <span className="font-medium text-slate-700 dark:text-slate-300">{formatDateTime(quote.createdAt)}</span>
                </p>
              </CardContent>
            </Card>

            <QuoteNotesHistorySection quote={quote} className="lg:col-span-2" />
          </div>

          <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base">Dòng hàng ({lines.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                      <th className="px-4 py-3 pl-5">Sản phẩm</th>
                      <th className="px-4 py-3 text-right">SL</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Giá BL hiện tại</th>
                      <th className="px-4 py-3 pr-5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                          Không có dòng.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line, idx) => (
                        <tr key={line.id ?? idx} className={idx % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-900/20" : undefined}>
                          <td className="px-4 py-3 pl-5">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{line.productName ?? "—"}</p>
                            <p className="text-xs text-slate-500">{line.variantName}</p>
                            <p className="text-[11px] text-slate-500">{line.currentSku ?? `Biến thể #${line.variantId}`}</p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{formatMoneyVnd(line.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                            {line.currentRetailPrice != null ? formatMoneyVnd(line.currentRetailPrice) : "—"}
                          </td>
                          <td className="px-4 py-3 pr-5 text-right font-mono text-sm font-semibold tabular-nums">{formatMoneyVnd(line.subTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <QuoteConvertToOrderDialog
            open={convertOpen}
            onOpenChange={setConvertOpen}
            accessToken={accessToken}
            quoteId={id}
            quoteCode={quote.quoteCode}
            customerId={quote.customer?.id}
            ordersListPath={paths.ordersList}
            customersListPath={paths.customersList}
            onConverted={(order) => {
              const oid = order?.id ?? order?.Id;
              if (oid != null) navigate(`${paths.ordersList}/${encodeURIComponent(String(oid))}`);
              else navigate(paths.ordersList);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
