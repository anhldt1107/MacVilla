import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  fetchAdminCustomerDebt,
  fetchAdminCustomerDetail,
  postAdminCustomerDebtAdjust,
} from "@/services/admin/adminCustomersApi";
import { fetchAdminInvoices } from "@/services/admin/adminInvoicesApi";
import {
  fetchAdminOrders,
  labelOrderStatus,
  labelPaymentStatus,
} from "@/services/admin/adminOrdersApi";
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Loader2, MapPin, Scale, UserRound } from "lucide-react";
import { getOrderStatusBadgeClass, getPaymentStatusBadgeClass } from "@/config/orderStatusTheme";
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

const ORDERS_PAGE_SIZE = 10;
const OVERDUE_PAGE_SIZE = 50;

/** Ngưỡng cảnh báo số tiền điều chỉnh (VND) — có thể chỉnh theo team. */
const DEBT_ADJUST_WARN_ABS_VND = 50_000_000;

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
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

function formatDateOnly(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return iso;
  }
}

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/** @param {Record<string, unknown> | null | undefined} debt */
function summarizeDebtPayload(debt) {
  if (!debt || typeof debt !== "object") return { primaryLabel: "Dư nợ", primaryValue: null, extras: [] };
  const candidates = [
    ["debtBalance", "DebtBalance"],
    ["balance", "Balance"],
    ["totalDebt", "TotalDebt"],
    ["currentBalance", "CurrentBalance"],
    ["outstandingAmount", "OutstandingAmount"],
  ];
  let primaryValue = null;
  for (const [c, p] of candidates) {
    const v = pick(debt, c, p);
    if (v !== undefined && v !== null && Number.isFinite(Number(v))) {
      primaryValue = Number(v);
      break;
    }
  }
  const extras = [];
  const creditLimit = pick(debt, "creditLimit", "CreditLimit");
  if (creditLimit != null && Number.isFinite(Number(creditLimit))) {
    extras.push({ label: "Hạn mức", value: formatMoneyVnd(creditLimit) });
  }
  const updated = pick(debt, "updatedAt", "UpdatedAt") ?? pick(debt, "lastUpdatedAt", "LastUpdatedAt");
  if (updated) extras.push({ label: "Cập nhật", value: formatDateTime(String(updated)) });
  return { primaryLabel: "Dư nợ", primaryValue, extras };
}

function parseSignedVndIntegerInput(raw) {
  const t = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "");
  if (t === "" || t === "-") return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

function userCanAdjustCustomerDebt(user) {
  const r = String(user?.roleName ?? "")
    .trim()
    .toLowerCase();
  return r === "manager" || r === "admin" || r === "administrator";
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-pulse" aria-hidden>
      <div className="h-4 w-2/3 max-w-md rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-12 w-full max-w-xl rounded-xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
          <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-800/70" />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   id: string;
 *   dashboardPath: string;
 *   customersListPath: string;
 *   orderDetailUrl: (orderId: string | number) => string;
 *   invoiceDetailUrl: (invoiceId: string | number) => string;
 * }} props
 */
export function CustomerProfileDetailView({ id, dashboardPath, customersListPath, orderDetailUrl, invoiceDetailUrl }) {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, user } = useAuth();

  const canAdjustDebt = userCanAdjustCustomerDebt(user);

  const [activeTab, setActiveTab] = useState(/** @type {"info" | "orders" | "debt"} */ ("info"));

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersData, setOrdersData] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [debt, setDebt] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtError, setDebtError] = useState("");

  const [overdueData, setOverdueData] = useState(null);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [overdueError, setOverdueError] = useState("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustRef, setAdjustRef] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const isB2B = String(customer?.customerType ?? "").toUpperCase() === "B2B";

  useLayoutEffect(() => {
    setOrdersPage(1);
    setActiveTab("info");
  }, [id]);

  useEffect(() => {
    if (!isB2B && activeTab === "debt") setActiveTab("info");
  }, [isB2B, activeTab]);

  const loadCustomer = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCustomerDetail(accessToken, id);
      setCustomer(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết khách hàng.";
      setError(msg);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  const loadOrders = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) return;
    const customerId = Number(id);
    if (Number.isNaN(customerId)) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = await fetchAdminOrders(accessToken, {
        customerId,
        page: ordersPage,
        pageSize: ORDERS_PAGE_SIZE,
      });
      setOrdersData(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được đơn hàng.";
      setOrdersError(msg);
      setOrdersData(null);
    } finally {
      setOrdersLoading(false);
    }
  }, [accessToken, isAuthenticated, id, ordersPage]);

  const loadDebtAndOverdue = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) return;
    const customerId = Number(id);
    if (Number.isNaN(customerId)) return;

    setDebtLoading(true);
    setDebtError("");
    setOverdueLoading(true);
    setOverdueError("");

    try {
      const d = await fetchAdminCustomerDebt(accessToken, id);
      setDebt(/** @type {Record<string, unknown>} */ (d));
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được công nợ.";
      setDebtError(msg);
      setDebt(null);
    } finally {
      setDebtLoading(false);
    }

    try {
      const inv = await fetchAdminInvoices(accessToken, {
        status: "Overdue",
        customerId,
        page: 1,
        pageSize: OVERDUE_PAGE_SIZE,
      });
      setOverdueData(inv);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được hóa đơn quá hạn.";
      setOverdueError(msg);
      setOverdueData(null);
    } finally {
      setOverdueLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!customer || !isB2B) return;
    void loadDebtAndOverdue();
  }, [customer, isB2B, loadDebtAndOverdue]);

  const orderItems = ordersData?.items ?? [];
  const orderTotal = ordersData?.totalCount ?? 0;
  const orderTotalPages = Math.max(1, Math.ceil(orderTotal / ORDERS_PAGE_SIZE) || 1);

  const overdueItems = overdueData?.items ?? [];

  const debtSummary = useMemo(() => summarizeDebtPayload(debt), [debt]);

  const parsedAdjustAmount = useMemo(() => parseSignedVndIntegerInput(adjustAmount), [adjustAmount]);
  const showLargeAmountWarn = Number.isFinite(parsedAdjustAmount) && Math.abs(parsedAdjustAmount) >= DEBT_ADJUST_WARN_ABS_VND;

  const openAdjust = () => {
    setAdjustError("");
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustRef("");
    setAdjustOpen(true);
  };

  const submitAdjust = async () => {
    if (!accessToken || !id) return;
    setAdjustError("");
    const amt = parseSignedVndIntegerInput(adjustAmount);
    if (!Number.isFinite(amt) || amt === 0) {
      setAdjustError("Nhập số tiền điều chỉnh (VND, số nguyên). Dương = tăng nợ, âm = giảm nợ.");
      return;
    }
    const reason = adjustReason.trim();
    if (!reason) {
      setAdjustError("Vui lòng nhập lý do (bắt buộc).");
      return;
    }
    setAdjustSubmitting(true);
    try {
      await postAdminCustomerDebtAdjust(accessToken, id, {
        amount: amt,
        reason,
        referenceCode: adjustRef.trim() || undefined,
      });
      // eslint-disable-next-line no-console
      console.info("[debt-adjust]", { customerId: id, amount: amt, reason, referenceCode: adjustRef.trim() || null, at: new Date().toISOString() });
      setAdjustOpen(false);
      await loadCustomer();
      await loadDebtAndOverdue();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không thực hiện được điều chỉnh.";
      setAdjustError(msg);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="mx-auto max-w-7xl text-sm text-muted-foreground">
        Thiếu tham số khách hàng.
      </div>
    );
  }

  const tabBtn = (tab, label) => (
    <button
      type="button"
      key={tab}
      role="tab"
      aria-selected={activeTab === tab}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        activeTab === tab
          ? "bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/25 dark:text-emerald-100"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      )}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <nav
        className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
        aria-label="Breadcrumb"
      >
        <Link
          to={dashboardPath}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="px-1.5 py-0.5 text-slate-400 dark:text-slate-500">Bán hàng</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={customersListPath}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Khách hàng
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="max-w-[min(100%,14rem)] truncate px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
          {customer?.fullName ?? `#${id}`}
        </span>
      </nav>

      {loading && !customer ? <DetailSkeleton /> : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && customer ? (
        <>
          <header className="border-b border-slate-200/90 pb-6 dark:border-slate-800">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Chi tiết khách hàng
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                  {customer.fullName}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-mono text-slate-700 dark:text-slate-300">ID {customer.id}</span>
                  {" · "}
                  <time dateTime={customer.createdAt}>Tham gia {formatDateTime(customer.createdAt)}</time>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                    customer.customerType === "B2B"
                      ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-800/50"
                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
                  )}
                >
                  {customer.customerType}
                </span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Phần chi tiết khách">
              {tabBtn("info", "Thông tin & địa chỉ")}
              {tabBtn("orders", "Đơn hàng")}
              {isB2B ? tabBtn("debt", "Công nợ") : null}
            </div>
          </header>

          {activeTab === "info" ? (
            <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
              <div className="min-w-0 space-y-6 lg:col-span-2">
                <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Tóm tắt</CardTitle>
                    <CardDescription>Liên hệ, thống kê mua hàng và công nợ trên hồ sơ.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Điện thoại</p>
                      <p className="mt-1 font-mono text-sm text-slate-800 dark:text-slate-200">{customer.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Email</p>
                      <p className="mt-1 truncate text-sm text-slate-800 dark:text-slate-200">{customer.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Số đơn</p>
                      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{customer.orderCount ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Tổng chi</p>
                      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{formatMoneyVnd(customer.totalSpent)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-slate-500">Công nợ (hồ sơ)</p>
                      <p
                        className={cn(
                          "mt-1 font-mono text-lg font-semibold tabular-nums",
                          Number(customer.debtBalance) > 0 ? "text-amber-800 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"
                        )}
                      >
                        {formatMoneyVnd(customer.debtBalance)}
                      </p>
                      {isB2B ? (
                        <Button type="button" variant="link" className="mt-1 h-auto p-0 text-sm" onClick={() => setActiveTab("debt")}>
                          Xem chi tiết công nợ B2B
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside className="min-w-0 space-y-6">
                <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-slate-500" strokeWidth={2} />
                      <CardTitle className="text-sm font-semibold">Liên hệ</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-mono text-slate-700 dark:text-slate-300">{customer.phone || "—"}</p>
                    <p className="truncate text-slate-600 dark:text-slate-400">{customer.email || "—"}</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Thống kê</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 font-mono text-sm tabular-nums">
                    <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-400">
                      <span className="font-sans text-sm">Số đơn</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{customer.orderCount ?? "—"}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-400">
                      <span className="font-sans text-sm">Tổng chi</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{formatMoneyVnd(customer.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-400">
                      <span className="font-sans text-sm">Công nợ</span>
                      <span
                        className={cn(
                          "font-medium",
                          Number(customer.debtBalance) > 0 ? "text-amber-800 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"
                        )}
                      >
                        {formatMoneyVnd(customer.debtBalance)}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <p className="font-sans font-medium text-slate-600 dark:text-slate-300">Đơn gần nhất</p>
                      <p className="mt-1 font-mono">{formatDateTime(customer.lastOrderDate)}</p>
                    </div>
                  </CardContent>
                </Card>

                {(customer.companyName || customer.taxCode || customer.companyAddress) && (
                  <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Doanh nghiệp</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {customer.companyName ? <p className="font-medium text-slate-900 dark:text-slate-100">{customer.companyName}</p> : null}
                      {customer.taxCode ? (
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">MST {customer.taxCode}</p>
                      ) : null}
                      {customer.companyAddress ? (
                        <p className="leading-relaxed text-slate-600 dark:text-slate-400">{customer.companyAddress}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" strokeWidth={2} />
                      <CardTitle className="text-sm font-semibold">Địa chỉ giao hàng</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(customer.addresses ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">Chưa có địa chỉ.</p>
                    ) : (
                      (customer.addresses ?? []).map((addr) => (
                        <div
                          key={addr.id}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/30"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{addr.receiverName}</p>
                            {addr.isDefault ? (
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                                Mặc định
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">{addr.receiverPhone}</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{addr.addressLine}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </aside>
            </div>
          ) : null}

          {activeTab === "orders" ? (
            <Card className="overflow-hidden border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:shadow-none">
              <CardHeader className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <ClipboardList className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold tracking-tight">Đơn hàng</CardTitle>
                      <CardDescription className="text-xs">
                        {orderTotal.toLocaleString("vi-VN")} đơn (theo bộ lọc khách)
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {ordersError ? (
                  <p className="px-6 py-4 text-sm text-red-700 dark:text-red-300" role="alert">
                    {ordersError}
                  </p>
                ) : null}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                        <th className="px-5 py-3.5 pl-6">Mã đơn</th>
                        <th className="px-5 py-3.5">Thời gian</th>
                        <th className="px-5 py-3.5">Trạng thái đơn</th>
                        <th className="px-5 py-3.5">Thanh toán</th>
                        <th className="px-5 py-3.5 pr-6 text-right font-mono">Tổng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ordersLoading && orderItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600/70" />
                          </td>
                        </tr>
                      ) : null}
                      {!ordersLoading && orderItems.length === 0 && !ordersError ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                            Chưa có đơn hàng.
                          </td>
                        </tr>
                      ) : null}
                      {orderItems.map((row, idx) => (
                        <tr
                          key={row.id}
                          tabIndex={0}
                          aria-label={`Xem đơn ${row.orderCode}`}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.06]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/25"
                          )}
                          onClick={() => navigate(orderDetailUrl(row.id))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(orderDetailUrl(row.id));
                            }
                          }}
                        >
                          <td className="whitespace-nowrap px-5 py-3.5 pl-6 align-middle">
                            <span className="inline-flex rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/15 dark:text-emerald-300">
                              {row.orderCode}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 align-middle text-xs text-slate-600 dark:text-slate-400">
                            {formatDateTime(row.createdAt)}
                          </td>
                          <td className="px-5 py-3.5 align-middle">
                            <span
                              className={cn(
                                "inline-flex max-w-[9rem] truncate rounded-full px-2.5 py-0.5 text-xs font-medium",
                                getOrderStatusBadgeClass(row.orderStatus)
                              )}
                              title={labelOrderStatus(row.orderStatus)}
                            >
                              {labelOrderStatus(row.orderStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 align-middle">
                            <span
                              className={cn(
                                "inline-flex max-w-[9rem] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                getPaymentStatusBadgeClass(row.paymentStatus)
                              )}
                              title={labelPaymentStatus(row.paymentStatus)}
                            >
                              {labelPaymentStatus(row.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 pr-6 text-right align-middle font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {formatMoneyVnd(row.payableTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {orderTotal > 0 ? (
                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Trang{" "}
                      <span className="font-mono font-medium tabular-nums text-slate-700 dark:text-slate-200">
                        {ordersPage} / {orderTotalPages}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
                        disabled={ordersLoading || ordersPage <= 1}
                        onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
                        disabled={ordersLoading || ordersPage >= orderTotalPages}
                        onClick={() => setOrdersPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "debt" && isB2B ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Công nợ B2B</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Tổng quan công nợ và danh sách hóa đơn quá hạn.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={debtLoading || overdueLoading} onClick={() => void loadDebtAndOverdue()}>
                    {(debtLoading || overdueLoading) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    Tải lại
                  </Button>
                  {canAdjustDebt ? (
                    <Button type="button" size="sm" className="gap-1.5" onClick={openAdjust}>
                      <Scale className="h-4 w-4" aria-hidden />
                      Điều chỉnh công nợ
                    </Button>
                  ) : null}
                </div>
              </div>

              <Card className="border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base">Tổng quan công nợ</CardTitle>
                  <CardDescription>Đối chiếu với số dư trên hồ sơ khách.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {debtError ? (
                    <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                      {debtError}
                    </p>
                  ) : null}
                  {debtLoading && !debt && !debtError ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      Đang tải công nợ…
                    </div>
                  ) : null}
                  {!debtLoading && debt ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{debtSummary.primaryLabel}</p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                          {debtSummary.primaryValue != null ? formatMoneyVnd(debtSummary.primaryValue) : "—"}
                        </p>
                        <p className="mt-2 font-mono text-xs text-slate-500">
                          Hồ sơ: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMoneyVnd(customer.debtBalance)}</span>
                        </p>
                      </div>
                      {debtSummary.extras.length > 0 ? (
                        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          {debtSummary.extras.map((x) => (
                            <li key={x.label}>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{x.label}:</span> {x.value}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base">Hóa đơn quá hạn</CardTitle>
                  <CardDescription>Trạng thái Overdue theo khách.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {overdueError ? (
                    <p className="px-6 py-4 text-sm text-red-700 dark:text-red-300" role="alert">
                      {overdueError}
                    </p>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                          <th className="px-5 py-3 pl-6">Mã HĐ</th>
                          <th className="px-5 py-3">Hạn</th>
                          <th className="px-5 py-3">Trạng thái</th>
                          <th className="px-5 py-3 pr-6 text-right">Phải thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {overdueLoading && overdueItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center">
                              <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-600/70" />
                            </td>
                          </tr>
                        ) : null}
                        {!overdueLoading && overdueItems.length === 0 && !overdueError ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                              Không có hóa đơn quá hạn.
                            </td>
                          </tr>
                        ) : null}
                        {overdueItems.map((row) => {
                          const invId = pick(row, "id", "Id");
                          const code =
                            pick(row, "invoiceCode", "InvoiceCode") ??
                            pick(row, "invoiceNumber", "InvoiceNumber") ??
                            (invId != null ? `#${invId}` : "—");
                          const due = pick(row, "dueDate", "DueDate");
                          const st = pick(row, "status", "Status");
                          const payable = pick(row, "payableTotal", "PayableTotal");
                          return (
                            <tr
                              key={String(invId)}
                              tabIndex={0}
                              className="cursor-pointer hover:bg-amber-500/[0.04] dark:hover:bg-amber-500/[0.06]"
                              onClick={() => invId != null && navigate(invoiceDetailUrl(invId))}
                              onKeyDown={(e) => {
                                if ((e.key === "Enter" || e.key === " ") && invId != null) {
                                  e.preventDefault();
                                  navigate(invoiceDetailUrl(invId));
                                }
                              }}
                            >
                              <td className="px-5 py-3 pl-6 font-mono text-xs font-semibold">{String(code)}</td>
                              <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">{formatDateOnly(due != null ? String(due) : "")}</td>
                              <td className="px-5 py-3 text-xs">{st != null ? String(st) : "—"}</td>
                              <td className="px-5 py-3 pr-6 text-right font-mono text-sm tabular-nums">{formatMoneyVnd(payable)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
            <DialogContent className="max-w-md border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle>Điều chỉnh công nợ</DialogTitle>
                <DialogDescription>
                  Số dương tăng nợ khách; số âm giảm nợ / ghi nhận thanh toán công nợ. Thao tác yêu cầu quyền Manager/Admin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                {showLargeAmountWarn ? (
                  <div
                    className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
                    role="status"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      Số tiền tuyệt đối ≥ {DEBT_ADJUST_WARN_ABS_VND.toLocaleString("vi-VN")} đ — vui lòng kiểm tra kỹ trước khi xác nhận.
                    </span>
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="adj-amt">
                    Số tiền (VND, số nguyên)
                  </label>
                  <input
                    id="adj-amt"
                    className={cn(
                      "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950",
                      "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    )}
                    inputMode="numeric"
                    placeholder="VD: -500000 hoặc 1000000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="adj-reason">
                    Lý do <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="adj-reason"
                    rows={3}
                    className={cn(
                      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950",
                      "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    )}
                    placeholder="Bắt buộc — ghi rõ nghiệp vụ để đối soát."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="adj-ref">
                    Mã tham chiếu (tuỳ chọn)
                  </label>
                  <input
                    id="adj-ref"
                    className={cn(
                      "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950",
                      "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    )}
                    placeholder="VD: KM2026-001"
                    value={adjustRef}
                    onChange={(e) => setAdjustRef(e.target.value)}
                  />
                </div>
                {adjustError ? (
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {adjustError}
                  </p>
                ) : null}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)} disabled={adjustSubmitting}>
                  Huỷ
                </Button>
                <Button type="button" onClick={() => void submitAdjust()} disabled={adjustSubmitting}>
                  {adjustSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Xác nhận điều chỉnh
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
