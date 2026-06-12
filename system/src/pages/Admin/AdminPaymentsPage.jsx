import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminCustomers } from "@/services/admin/adminCustomersApi";
import { fetchAdminInvoiceDetail, fetchAdminInvoices } from "@/services/admin/adminInvoicesApi";
import {
  createAdminPayment,
  createAdminPaymentRefund,
  fetchAdminPaymentTransactionTypes,
  fetchAdminPayments,
  labelAdminPaymentMethod,
  labelAdminPaymentTransactionType,
  paymentRowAccentClass,
} from "@/services/admin/adminPaymentsApi";
import { ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, Undo2, X } from "lucide-react";
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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldSelect = cn(fieldInput, "cursor-pointer appearance-none bg-transparent pr-10");

const PAYMENT_METHOD_VALUES = [
  { value: "BankTransfer", label: "Chuyển khoản" },
  { value: "Cash", label: "Tiền mặt" },
  { value: "Card", label: "Thẻ" },
  { value: "MoMo", label: "MoMo" },
  { value: "VNPay", label: "VNPay" },
  { value: "Other", label: "Khác" },
];

function pickRow(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const x = Number(n);
  const sign = x < 0 ? "-" : "";
  return `${sign}${Math.abs(x).toLocaleString("vi-VN")} đ`;
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

function fromDatetimeLocalToIso(local) {
  const t = String(local || "").trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function defaultPaymentDatetimeLocal() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyRecordForm() {
  return {
    customerId: "",
    invoiceId: "",
    amount: "",
    paymentMethod: "BankTransfer",
    paymentDate: defaultPaymentDatetimeLocal(),
    referenceCode: "",
    note: "",
  };
}

/**
 * Chọn khách / hóa đơn bằng tìm kiếm (popup ghi nhận & hoàn tiền).
 * @param {{
 *   accessToken: string | null;
 *   active: boolean;
 *   disabled: boolean;
 *   customerId: string;
 *   invoiceId: string;
 *   amount: string;
 *   onPatch: (p: Partial<{ customerId: string; invoiceId: string; amount: string }>) => void;
 *   onMeta?: (m: { customerLabel: string; invoiceLabel: string }) => void;
 * }} props
 */
function PaymentPartyPickers({ accessToken, active, disabled, customerId, invoiceId, amount, onPatch, onMeta = undefined }) {
  const [custQ, setCustQ] = useState("");
  const [custDeb, setCustDeb] = useState("");
  const [custHits, setCustHits] = useState([]);
  const [custLoading, setCustLoading] = useState(false);

  const [invGlobQ, setInvGlobQ] = useState("");
  const [invGlobDeb, setInvGlobDeb] = useState("");
  const [invGlobHits, setInvGlobHits] = useState([]);
  const [invGlobLoading, setInvGlobLoading] = useState(false);

  const [invByCustQ, setInvByCustQ] = useState("");
  const [invByCustDeb, setInvByCustDeb] = useState("");
  const [invByCustHits, setInvByCustHits] = useState([]);
  const [invByCustLoading, setInvByCustLoading] = useState(false);

  const [custLabel, setCustLabel] = useState("");
  const [invLabel, setInvLabel] = useState("");
  const [invRemaining, setInvRemaining] = useState(/** @type {number|null} */ (null));
  const [showManualIds, setShowManualIds] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCustDeb(custQ), 400);
    return () => window.clearTimeout(t);
  }, [custQ]);

  useEffect(() => {
    const t = window.setTimeout(() => setInvGlobDeb(invGlobQ), 400);
    return () => window.clearTimeout(t);
  }, [invGlobQ]);

  useEffect(() => {
    const t = window.setTimeout(() => setInvByCustDeb(invByCustQ), 400);
    return () => window.clearTimeout(t);
  }, [invByCustQ]);

  useEffect(() => {
    if (!active) {
      setCustQ("");
      setCustDeb("");
      setCustHits([]);
      setInvGlobQ("");
      setInvGlobDeb("");
      setInvGlobHits([]);
      setInvByCustQ("");
      setInvByCustDeb("");
      setInvByCustHits([]);
      setCustLabel("");
      setInvLabel("");
      setInvRemaining(null);
      setShowManualIds(false);
    }
  }, [active]);

  useEffect(() => {
    if (!active || !accessToken || !custDeb.trim()) {
      setCustHits([]);
      return;
    }
    let c = false;
    (async () => {
      setCustLoading(true);
      try {
        const r = await fetchAdminCustomers(accessToken, { page: 1, pageSize: 12, search: custDeb.trim() });
        if (!c) setCustHits(r.items ?? []);
      } catch {
        if (!c) setCustHits([]);
      } finally {
        if (!c) setCustLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [accessToken, active, custDeb]);

  useEffect(() => {
    if (!active || !accessToken || !invGlobDeb.trim()) {
      setInvGlobHits([]);
      return;
    }
    let c = false;
    (async () => {
      setInvGlobLoading(true);
      try {
        const r = await fetchAdminInvoices(accessToken, { page: 1, pageSize: 12, search: invGlobDeb.trim() });
        if (!c) setInvGlobHits(r.items ?? []);
      } catch {
        if (!c) setInvGlobHits([]);
      } finally {
        if (!c) setInvGlobLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [accessToken, active, invGlobDeb]);

  useEffect(() => {
    if (!active || !accessToken) return;
    const cid = Number(customerId);
    if (!Number.isFinite(cid) || cid < 1) {
      setInvByCustHits([]);
      return;
    }
    let c = false;
    (async () => {
      setInvByCustLoading(true);
      try {
        const r = await fetchAdminInvoices(accessToken, {
          page: 1,
          pageSize: 20,
          customerId: cid,
          search: invByCustDeb.trim() || undefined,
        });
        if (!c) setInvByCustHits(r.items ?? []);
      } catch {
        if (!c) setInvByCustHits([]);
      } finally {
        if (!c) setInvByCustLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [accessToken, active, customerId, invByCustDeb]);

  const applyCustomerRow = (row) => {
    const id = pickRow(row, "id", "Id");
    const fn = pickRow(row, "fullName", "FullName");
    const phone = pickRow(row, "phone", "Phone");
    if (id == null || !Number.isFinite(Number(id))) return;
    onPatch({ customerId: String(Number(id)), invoiceId: "" });
    const bits = [fn != null ? String(fn) : "", phone != null ? String(phone) : ""].filter(Boolean);
    setCustLabel(bits.join(" · ") || `Khách #${id}`);
    setInvLabel("");
    setInvRemaining(null);
    setCustQ("");
    setCustDeb("");
    setCustHits([]);
  };

  const applyInvoiceRow = (row) => {
    const iid = pickRow(row, "id", "Id");
    const cid = pickRow(row, "customerId", "CustomerId");
    const cname = pickRow(row, "customerName", "CustomerName");
    const num = pickRow(row, "invoiceNumber", "InvoiceNumber");
    const rem = pickRow(row, "remainingAmount", "RemainingAmount");
    const tot = pickRow(row, "totalAmount", "TotalAmount");
    if (cid == null || !Number.isFinite(Number(cid)) || iid == null || !Number.isFinite(Number(iid))) return;
    const remNum = rem != null && Number.isFinite(Number(rem)) ? Number(rem) : null;
    const amtHint =
      remNum != null && remNum > 0 ? remNum : tot != null && Number.isFinite(Number(tot)) && Number(tot) > 0 ? Number(tot) : null;
    onPatch({
      customerId: String(Number(cid)),
      invoiceId: String(Number(iid)),
      amount: !String(amount || "").trim() && amtHint != null ? String(amtHint) : amount,
    });
    const cl = cname != null ? String(cname) : `Khách #${cid}`;
    const il = num != null ? String(num) : `HĐ #${iid}`;
    setCustLabel(cl);
    setInvLabel(il);
    setInvRemaining(remNum);
    onMeta?.({ customerLabel: cl, invoiceLabel: il });
    setInvGlobQ("");
    setInvGlobDeb("");
    setInvGlobHits([]);
    setInvByCustQ("");
    setInvByCustDeb("");
    setInvByCustHits([]);
  };

  const applyInvoiceForCustomerOnly = (row) => {
    const iid = pickRow(row, "id", "Id");
    const num = pickRow(row, "invoiceNumber", "InvoiceNumber");
    const rem = pickRow(row, "remainingAmount", "RemainingAmount");
    const tot = pickRow(row, "totalAmount", "TotalAmount");
    if (iid == null || !Number.isFinite(Number(iid))) return;
    const remNum = rem != null && Number.isFinite(Number(rem)) ? Number(rem) : null;
    const amtHint =
      remNum != null && remNum > 0 ? remNum : tot != null && Number.isFinite(Number(tot)) && Number(tot) > 0 ? Number(tot) : null;
    onPatch({
      invoiceId: String(Number(iid)),
      amount: !String(amount || "").trim() && amtHint != null ? String(amtHint) : amount,
    });
    const il = num != null ? String(num) : `HĐ #${iid}`;
    setInvLabel(il);
    setInvRemaining(remNum);
    onMeta?.({ customerLabel: custLabel, invoiceLabel: il });
    setInvByCustQ("");
    setInvByCustDeb("");
    setInvByCustHits([]);
  };

  const clearCustomer = () => {
    onPatch({ customerId: "", invoiceId: "" });
    setCustLabel("");
    setInvLabel("");
    setInvRemaining(null);
    onMeta?.({ customerLabel: "", invoiceLabel: "" });
  };

  const clearInvoice = () => {
    onPatch({ invoiceId: "" });
    setInvLabel("");
    setInvRemaining(null);
    onMeta?.({ customerLabel: custLabel, invoiceLabel: "" });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Tìm theo hóa đơn (nhanh)</label>
        <input
          type="search"
          className={fieldInput}
          placeholder="Số HĐ, mã, tên khách…"
          value={invGlobQ}
          onChange={(e) => setInvGlobQ(e.target.value)}
          disabled={disabled}
        />
        {invGlobLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Đang tìm…
          </div>
        ) : null}
        {invGlobHits.length > 0 ? (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
            {invGlobHits.map((row, idx) => {
              const iid = pickRow(row, "id", "Id");
              const num = pickRow(row, "invoiceNumber", "InvoiceNumber");
              const cname = pickRow(row, "customerName", "CustomerName");
              const rem = pickRow(row, "remainingAmount", "RemainingAmount");
              return (
                <li key={iid != null ? String(iid) : idx}>
                  <button
                    type="button"
                    className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                    disabled={disabled}
                    onClick={() => applyInvoiceRow(row)}
                  >
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {num != null ? String(num) : iid != null ? `#${iid}` : "—"}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {cname != null ? String(cname) : "—"}
                      {rem != null ? (
                        <span className="text-slate-500"> · Còn {formatMoneyVnd(Number(rem))}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : invGlobDeb.trim() && !invGlobLoading ? (
          <p className="text-xs text-slate-500">Không thấy hóa đơn.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Khách hàng <span className="text-red-600">*</span>
          </label>
          {customerId.trim() && /^\d+$/.test(customerId.trim()) ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" disabled={disabled} onClick={clearCustomer}>
              Đổi khách
            </Button>
          ) : null}
        </div>
        {customerId.trim() && /^\d+$/.test(customerId.trim()) ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{custLabel || "Đã chọn khách"}</p>
            <p className="text-xs text-slate-500">Mã khách: {customerId}</p>
          </div>
        ) : (
          <>
            <input
              type="search"
              className={fieldInput}
              placeholder="Tên, SĐT, email…"
              value={custQ}
              onChange={(e) => setCustQ(e.target.value)}
              disabled={disabled}
            />
            {custLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Đang tìm…
              </div>
            ) : null}
            {custHits.length > 0 ? (
              <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                {custHits.map((row, idx) => {
                  const id = pickRow(row, "id", "Id");
                  const fn = pickRow(row, "fullName", "FullName");
                  const phone = pickRow(row, "phone", "Phone");
                  return (
                    <li key={id != null ? String(id) : idx}>
                      <button
                        type="button"
                        className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                        disabled={disabled}
                        onClick={() => applyCustomerRow(row)}
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100">{fn != null ? String(fn) : `#${id}`}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {phone != null ? String(phone) : ""}
                          {id != null ? <span className="font-mono text-slate-500"> · #{id}</span> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : custDeb.trim() && !custLoading ? (
              <p className="text-xs text-slate-500">Không thấy khách.</p>
            ) : (
              <p className="text-xs text-slate-500">Gõ vài ký tự để tìm khách.</p>
            )}
          </>
        )}
      </div>

      {customerId.trim() && /^\d+$/.test(customerId.trim()) ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Hóa đơn (tuỳ chọn)</label>
            {invoiceId.trim() && /^\d+$/.test(invoiceId.trim()) ? (
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" disabled={disabled} onClick={clearInvoice}>
                <X className="h-3 w-3" aria-hidden />
                Bỏ HĐ
              </Button>
            ) : null}
          </div>
          {invoiceId.trim() && /^\d+$/.test(invoiceId.trim()) ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{invLabel || `Hóa đơn #${invoiceId}`}</p>
              <p className="text-xs text-slate-500">Mã hóa đơn: {invoiceId}</p>
              {invRemaining != null && invRemaining > 0 ? (
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mt-1">
                  Còn lại: {formatMoneyVnd(invRemaining)}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <input
                type="search"
                className={fieldInput}
                placeholder="Lọc hóa đơn của khách…"
                value={invByCustQ}
                onChange={(e) => setInvByCustQ(e.target.value)}
                disabled={disabled}
              />
              {invByCustLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Đang tải…
                </div>
              ) : null}
              {invByCustHits.length > 0 ? (
                <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                  {invByCustHits.map((row, idx) => {
                    const iid = pickRow(row, "id", "Id");
                    const num = pickRow(row, "invoiceNumber", "InvoiceNumber");
                    const rem = pickRow(row, "remainingAmount", "RemainingAmount");
                    return (
                      <li key={iid != null ? String(iid) : idx}>
                        <button
                          type="button"
                          className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                          disabled={disabled}
                          onClick={() => applyInvoiceForCustomerOnly(row)}
                        >
                          <span className="font-mono font-semibold">{num != null ? String(num) : `#${iid}`}</span>
                          <span className="text-xs text-slate-600">
                            {rem != null ? <>Còn {formatMoneyVnd(Number(rem))}</> : "—"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Không có hóa đơn hoặc chưa khớp bộ lọc.</p>
              )}
            </>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <button
          type="button"
          className="text-xs font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          onClick={() => setShowManualIds((v) => !v)}
        >
          {showManualIds ? "Ẩn nhập ID thủ công" : "Nhập ID thủ công (nâng cao)"}
        </button>
        {showManualIds ? (
          <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-600">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500">customerId</label>
              <input
                type="text"
                inputMode="numeric"
                className={fieldInput}
                value={customerId}
                onChange={(e) => {
                  onPatch({ customerId: e.target.value });
                  setCustLabel("");
                }}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500">invoiceId</label>
              <input
                type="text"
                inputMode="numeric"
                className={fieldInput}
                value={invoiceId}
                onChange={(e) => {
                  onPatch({ invoiceId: e.target.value });
                  setInvLabel("");
                }}
                disabled={disabled}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Sổ thanh toán — .
 */
export function AdminPaymentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();
  const isSalesShell = paths.shell === "saler";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);

  const [recordOpen, setRecordOpen] = useState(false);
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordForm, setRecordForm] = useState(() => emptyRecordForm());

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundStep, setRefundStep] = useState(1);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [refundForm, setRefundForm] = useState(() => emptyRecordForm());
  const [refundPartyMeta, setRefundPartyMeta] = useState({ customerLabel: "", invoiceLabel: "" });

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const inv = searchParams.get("invoiceId");
    if (inv && /^\d+$/.test(inv)) {
      setInvoiceId(inv);
      setRecordForm((f) => ({ ...f, invoiceId: inv }));
    }
    const cust = searchParams.get("customerId");
    if (cust && /^\d+$/.test(cust)) {
      setCustomerId(cust);
      setRecordForm((f) => ({ ...f, customerId: cust }));
    }
    const ord = searchParams.get("orderId");
    if (ord && /^\d+$/.test(ord)) {
      setOrderIdFilter(ord);
    }
    const ticket = searchParams.get("ticketNumber");
    if (ticket && String(ticket).trim()) {
      setSearchInput(String(ticket).trim());
      setSearch(String(ticket).trim());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const inv = searchParams.get("invoiceId");
    if (!inv || !/^\d+$/.test(inv)) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchAdminInvoiceDetail(accessToken, inv);
        if (cancelled || !d || typeof d !== "object") return;
        const rec = /** @type {Record<string, unknown>} */ (d);
        const cid = rec.customerId ?? rec.CustomerId;
        if (cid != null) {
          setRecordForm((f) => ({
            ...f,
            invoiceId: inv,
            customerId: String(cid),
          }));
        }
      } catch {
        /* bỏ qua — form vẫn dùng invoiceId từ URL */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated, searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const opts = await fetchAdminPaymentTransactionTypes(accessToken);
        if (!cancelled) setTypeOptions(opts.filter((o) => o.value));
      } catch {
        if (!cancelled) setTypeOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [customerId, invoiceId, orderIdFilter, transactionType, paymentMethod, fromDate, toDate, search, pageSize]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cid = customerId.trim();
      const iid = invoiceId.trim();
      const oid = orderIdFilter.trim();
      const result = await fetchAdminPayments(accessToken, {
        page,
        pageSize,
        customerId: cid && /^\d+$/.test(cid) ? cid : undefined,
        invoiceId: iid && /^\d+$/.test(iid) ? iid : undefined,
        orderId: oid && /^\d+$/.test(oid) ? oid : undefined,
        transactionType: transactionType || undefined,
        paymentMethod: paymentMethod || undefined,
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
            : "Không tải được danh sách thanh toán.";
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
    customerId,
    invoiceId,
    orderIdFilter,
    transactionType,
    paymentMethod,
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

  const typeFilterOptions = useMemo(
    () => [
      { value: "", label: "Tất cả loại GD" },
      ...typeOptions.map((o) => ({
        value: o.value,
        label: labelAdminPaymentTransactionType(o.value, typeOptions),
      })),
    ],
    [typeOptions]
  );
  const methodFilterOptions = useMemo(
    () => [{ value: "", label: "Tất cả PTTT" }, ...PAYMENT_METHOD_VALUES],
    []
  );

  const clearFilters = () => {
    setCustomerId("");
    setInvoiceId("");
    setTransactionType("");
    setPaymentMethod("");
    setFromDate("");
    setToDate("");
    setSearchInput("");
    setSearch("");
  };

  const hasActiveFilters = Boolean(
    customerId.trim() ||
      invoiceId.trim() ||
      transactionType ||
      paymentMethod ||
      fromDate ||
      toDate ||
      searchInput.trim()
  );

  const submitRecord = async () => {
    if (!accessToken || recordSubmitting) return;
    const cust = Number(recordForm.customerId);
    if (!Number.isFinite(cust) || cust < 1) {
      setRecordError("Nhập mã khách hàng (customerId) hợp lệ.");
      return;
    }
    const amt = Number(String(recordForm.amount).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(amt) || amt <= 0) {
      setRecordError("Số tiền phải là số dương.");
      return;
    }
    const payIso = fromDatetimeLocalToIso(recordForm.paymentDate);
    if (!payIso) {
      setRecordError("Chọn ngày giờ thanh toán hợp lệ.");
      return;
    }
    if (!recordForm.paymentMethod.trim()) {
      setRecordError("Chọn phương thức thanh toán.");
      return;
    }
    setRecordSubmitting(true);
    setRecordError("");
    try {
      /** @type {import("@/services/admin/adminPaymentsApi").AdminPaymentRecordPayload} */
      const body = {
        customerId: cust,
        amount: amt,
        paymentMethod: recordForm.paymentMethod.trim(),
        paymentDate: payIso,
      };
      const inv = recordForm.invoiceId.trim();
      if (inv && /^\d+$/.test(inv)) body.invoiceId = Number(inv);
      const ref = recordForm.referenceCode.trim();
      if (ref) body.referenceCode = ref;
      const note = recordForm.note.trim();
      if (note) body.note = note;

      const created = await createAdminPayment(accessToken, body);
      const raw = created && typeof created === "object" ? /** @type {Record<string, unknown>} */ (created) : {};
      const newId = raw.id ?? raw.Id;
      setRecordOpen(false);
      setRecordForm(emptyRecordForm());
      void load();
      if (newId != null && Number.isFinite(Number(newId))) {
        navigate(`${paths.paymentsList}/${Number(newId)}`);
      }
    } catch (e) {
      setRecordError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Ghi nhận thất bại.");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const submitRefund = async () => {
    if (!accessToken || refundSubmitting || refundStep !== 2) return;
    const cust = Number(refundForm.customerId);
    if (!Number.isFinite(cust) || cust < 1) {
      setRefundError("Nhập mã khách hàng hợp lệ.");
      return;
    }
    const amt = Number(String(refundForm.amount).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(amt) || amt <= 0) {
      setRefundError("Số tiền hoàn phải là số dương.");
      return;
    }
    const payIso = fromDatetimeLocalToIso(refundForm.paymentDate);
    if (!payIso) {
      setRefundError("Chọn ngày giờ hợp lệ.");
      return;
    }
    if (!refundForm.paymentMethod.trim()) {
      setRefundError("Chọn phương thức.");
      return;
    }
    setRefundSubmitting(true);
    setRefundError("");
    try {
      /** @type {import("@/services/admin/adminPaymentsApi").AdminPaymentRecordPayload} */
      const body = {
        customerId: cust,
        amount: amt,
        paymentMethod: refundForm.paymentMethod.trim(),
        paymentDate: payIso,
      };
      const inv = refundForm.invoiceId.trim();
      if (inv && /^\d+$/.test(inv)) body.invoiceId = Number(inv);
      const ref = refundForm.referenceCode.trim();
      if (ref) body.referenceCode = ref;
      const note = refundForm.note.trim();
      if (note) body.note = note;

      const created = await createAdminPaymentRefund(accessToken, body);
      const raw = created && typeof created === "object" ? /** @type {Record<string, unknown>} */ (created) : {};
      const newId = raw.id ?? raw.Id;
      setRefundOpen(false);
      setRefundStep(1);
      setRefundForm(emptyRecordForm());
      void load();
      if (newId != null && Number.isFinite(Number(newId))) {
        navigate(`${paths.paymentsList}/${Number(newId)}`);
      }
    } catch (e) {
      setRefundError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Hoàn tiền thất bại.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const openRecordFromFilters = () => {
    setRecordError("");
    setRecordForm({
      ...emptyRecordForm(),
      customerId: customerId.trim() && /^\d+$/.test(customerId.trim()) ? customerId.trim() : "",
      invoiceId: invoiceId.trim() && /^\d+$/.test(invoiceId.trim()) ? invoiceId.trim() : "",
    });
    setRecordOpen(true);
  };

  return (
    <div className="space-y-6">
      <Dialog
        open={recordOpen}
        onOpenChange={(open) => {
          setRecordOpen(open);
          if (!open) {
            setRecordError("");
            setRecordForm(emptyRecordForm());
          }
        }}
      >
        <DialogContent
          className="max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:max-w-2xl"
          onPointerDownOutside={(e) => recordSubmitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
            <DialogDescription>Chọn khách hoặc hóa đơn; số tiền có thể gợi ý từ số còn nợ.</DialogDescription>
          </DialogHeader>
          <PaymentPartyPickers
            accessToken={accessToken}
            active={recordOpen}
            disabled={recordSubmitting}
            customerId={recordForm.customerId}
            invoiceId={recordForm.invoiceId}
            amount={recordForm.amount}
            onPatch={(p) => setRecordForm((f) => ({ ...f, ...p }))}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="pay-amt">
                Số tiền (đ) <span className="text-red-600">*</span>
              </label>
              <input
                id="pay-amt"
                type="text"
                inputMode="decimal"
                className={fieldInput}
                value={recordForm.amount}
                onChange={(e) => setRecordForm((f) => ({ ...f, amount: e.target.value }))}
                disabled={recordSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="pay-method">
                Phương thức <span className="text-red-600">*</span>
              </label>
              <select
                id="pay-method"
                className={fieldSelect}
                value={recordForm.paymentMethod}
                onChange={(e) => setRecordForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                disabled={recordSubmitting}
              >
                {PAYMENT_METHOD_VALUES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="pay-when">
                Thời điểm <span className="text-red-600">*</span>
              </label>
              <input
                id="pay-when"
                type="datetime-local"
                className={fieldInput}
                value={recordForm.paymentDate}
                onChange={(e) => setRecordForm((f) => ({ ...f, paymentDate: e.target.value }))}
                disabled={recordSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="pay-ref">
                Mã tham chiếu
              </label>
              <input
                id="pay-ref"
                type="text"
                className={fieldInput}
                value={recordForm.referenceCode}
                onChange={(e) => setRecordForm((f) => ({ ...f, referenceCode: e.target.value }))}
                disabled={recordSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="pay-note">
                Ghi chú
              </label>
              <textarea
                id="pay-note"
                rows={2}
                className={cn(fieldInput, "min-h-[72px] resize-y py-2")}
                value={recordForm.note}
                onChange={(e) => setRecordForm((f) => ({ ...f, note: e.target.value }))}
                disabled={recordSubmitting}
              />
            </div>
          </div>
          {recordError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {recordError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={recordSubmitting} onClick={() => setRecordOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={recordSubmitting} onClick={() => void submitRecord()}>
              {recordSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Ghi nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={refundOpen}
        onOpenChange={(open) => {
          setRefundOpen(open);
          if (!open) {
            setRefundError("");
            setRefundStep(1);
            setRefundForm(emptyRecordForm());
            setRefundPartyMeta({ customerLabel: "", invoiceLabel: "" });
          }
        }}
      >
        <DialogContent
          className="max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:max-w-2xl"
          onPointerDownOutside={(e) => refundSubmitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Hoàn tiền</DialogTitle>
            <DialogDescription>Chọn khách và hóa đơn tương tự khi ghi nhận thanh toán.</DialogDescription>
          </DialogHeader>
          {refundStep === 2 ? (
            <div className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/25">
              <p className="font-medium text-amber-950 dark:text-amber-100">Xác nhận hoàn tiền</p>
              <ul className="list-inside list-disc space-y-1 text-amber-900/90 dark:text-amber-200/90">
                <li>
                  {refundPartyMeta.customerLabel ? (
                    <span>
                      {refundPartyMeta.customerLabel}{" "}
                      <span className="font-mono text-amber-950/80 dark:text-amber-200/80">
                        (#{refundForm.customerId.trim() || "—"})
                      </span>
                    </span>
                  ) : (
                    <span>Khách #{refundForm.customerId.trim() || "—"}</span>
                  )}
                </li>
                {refundForm.invoiceId.trim() ? (
                  <li>
                    {refundPartyMeta.invoiceLabel ? (
                      <span>
                        {refundPartyMeta.invoiceLabel}{" "}
                        <span className="font-mono text-amber-950/80 dark:text-amber-200/80">
                          (#{refundForm.invoiceId.trim()})
                        </span>
                      </span>
                    ) : (
                      <span>Hóa đơn #{refundForm.invoiceId.trim()}</span>
                    )}
                  </li>
                ) : (
                  <li>Không gắn HĐ</li>
                )}
                <li>Số tiền: {formatMoneyVnd(Number(String(refundForm.amount).replace(/\s/g, "").replace(",", ".")))}</li>
                <li>PTTT: {labelAdminPaymentMethod(refundForm.paymentMethod)}</li>
              </ul>
            </div>
          ) : (
            <>
              <PaymentPartyPickers
                accessToken={accessToken}
                active={refundOpen && refundStep === 1}
                disabled={refundSubmitting}
                customerId={refundForm.customerId}
                invoiceId={refundForm.invoiceId}
                amount={refundForm.amount}
                onPatch={(p) => setRefundForm((f) => ({ ...f, ...p }))}
                onMeta={setRefundPartyMeta}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rf-amt">
                  Số tiền hoàn (đ) <span className="text-red-600">*</span>
                </label>
                <input
                  id="rf-amt"
                  type="text"
                  inputMode="decimal"
                  className={fieldInput}
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm((f) => ({ ...f, amount: e.target.value }))}
                  disabled={refundSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rf-method">
                  Phương thức <span className="text-red-600">*</span>
                </label>
                <select
                  id="rf-method"
                  className={fieldSelect}
                  value={refundForm.paymentMethod}
                  onChange={(e) => setRefundForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  disabled={refundSubmitting}
                >
                  {PAYMENT_METHOD_VALUES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rf-when">
                  Thời điểm <span className="text-red-600">*</span>
                </label>
                <input
                  id="rf-when"
                  type="datetime-local"
                  className={fieldInput}
                  value={refundForm.paymentDate}
                  onChange={(e) => setRefundForm((f) => ({ ...f, paymentDate: e.target.value }))}
                  disabled={refundSubmitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rf-ref">
                  Mã tham chiếu
                </label>
                <input
                  id="rf-ref"
                  type="text"
                  className={fieldInput}
                  value={refundForm.referenceCode}
                  onChange={(e) => setRefundForm((f) => ({ ...f, referenceCode: e.target.value }))}
                  disabled={refundSubmitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rf-note">
                  Ghi chú
                </label>
                <textarea
                  id="rf-note"
                  rows={2}
                  className={cn(fieldInput, "min-h-[72px] resize-y py-2")}
                  value={refundForm.note}
                  onChange={(e) => setRefundForm((f) => ({ ...f, note: e.target.value }))}
                  disabled={refundSubmitting}
                />
              </div>
            </div>
            </>
          )}
          {refundError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {refundError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            {refundStep === 2 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={refundSubmitting}
                  onClick={() => {
                    setRefundStep(1);
                    setRefundError("");
                  }}
                >
                  Quay lại
                </Button>
                <Button type="button" variant="destructive" disabled={refundSubmitting} onClick={() => void submitRefund()}>
                  {refundSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Xác nhận hoàn tiền
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setRefundOpen(false)}>
                  Đóng
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setRefundError("");
                    const cust = Number(refundForm.customerId);
                    if (!Number.isFinite(cust) || cust < 1) {
                      setRefundError("Nhập mã khách hàng hợp lệ.");
                      return;
                    }
                    const amt = Number(String(refundForm.amount).replace(/\s/g, "").replace(",", "."));
                    if (!Number.isFinite(amt) || amt <= 0) {
                      setRefundError("Số tiền hoàn phải là số dương.");
                      return;
                    }
                    if (!fromDatetimeLocalToIso(refundForm.paymentDate)) {
                      setRefundError("Chọn ngày giờ hợp lệ.");
                      return;
                    }
                    if (!refundForm.paymentMethod.trim()) {
                      setRefundError("Chọn phương thức.");
                      return;
                    }
                    setRefundStep(2);
                  }}
                >
                  Tiếp tục
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Thanh toán</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={loading} onClick={() => void load()}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Tải lại
          </Button>
          {!isSalesShell ? (
            <>
              <Button type="button" size="sm" className="gap-1.5" onClick={openRecordFromFilters}>
                <Plus className="h-4 w-4" aria-hidden />
                Ghi nhận thanh toán
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setRefundError("");
                  setRefundStep(1);
                  setRefundPartyMeta({ customerLabel: "", invoiceLabel: "" });
                  setRefundForm((f) => ({
                    ...emptyRecordForm(),
                    customerId: customerId.trim() && /^\d+$/.test(customerId.trim()) ? customerId.trim() : "",
                    invoiceId: invoiceId.trim() && /^\d+$/.test(invoiceId.trim()) ? invoiceId.trim() : "",
                  }));
                  setRefundOpen(true);
                }}
              >
                <Undo2 className="h-4 w-4" aria-hidden />
                Hoàn tiền
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="grid gap-3 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-from">
              Từ ngày
            </label>
            <input id="flt-from" type="date" className={fieldInput} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-to">
              Đến ngày
            </label>
            <input id="flt-to" type="date" className={fieldInput} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-cust">
              Khách (ID)
            </label>
            <input
              id="flt-cust"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-inv">
              Hóa đơn (ID)
            </label>
            <input
              id="flt-inv"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-order">
              Đơn hàng (ID)
            </label>
            <input
              id="flt-order"
              type="text"
              inputMode="numeric"
              className={fieldInput}
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              placeholder="Giao dịch gắn HĐ của đơn"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-tx">
              Loại giao dịch
            </label>
            <select
              id="flt-tx"
              className={fieldSelect}
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              {typeFilterOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-method">
              Phương thức
            </label>
            <select
              id="flt-method"
              className={fieldSelect}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {methodFilterOptions.map((o) => (
                <option key={o.value || "all-m"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="flt-q">
              Tìm kiếm
            </label>
            <input
              id="flt-q"
              type="search"
              placeholder="Mã tham chiếu, ghi chú…"
              className={fieldInput}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
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
            <CardTitle className="text-base">Danh sách · {totalCount.toLocaleString("vi-VN")} giao dịch</CardTitle>
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
                  <th className="px-4 py-3 pl-6">Thời điểm</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">PTTT</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Hóa đơn</th>
                  <th className="px-4 py-3 pr-6">Tham chiếu</th>
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
                      Không có giao dịch phù hợp.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const rid = pickRow(row, "id", "Id");
                  const payDate = pickRow(row, "paymentDate", "PaymentDate") ?? pickRow(row, "createdAt", "CreatedAt");
                  const tx = pickRow(row, "transactionType", "TransactionType");
                  const method = pickRow(row, "paymentMethod", "PaymentMethod");
                  const amt = pickRow(row, "amount", "Amount");
                  const cid = pickRow(row, "customerId", "CustomerId");
                  const cname = pickRow(row, "customerName", "CustomerName");
                  const iid = pickRow(row, "invoiceId", "InvoiceId");
                  const refc = pickRow(row, "referenceCode", "ReferenceCode");
                  return (
                    <tr
                      key={rid != null ? String(rid) : idx}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/20"
                      )}
                      onClick={() => rid != null && navigate(`${paths.paymentsList}/${encodeURIComponent(String(rid))}`)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 pl-6 text-xs text-slate-700 dark:text-slate-300">
                        {formatDateTime(payDate != null ? String(payDate) : "")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {labelAdminPaymentTransactionType(tx != null ? String(tx) : "", typeOptions)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                        {labelAdminPaymentMethod(method != null ? String(method) : "")}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right text-sm font-semibold tabular-nums",
                          paymentRowAccentClass(tx != null ? String(tx) : "", amt != null ? Number(amt) : undefined)
                        )}
                      >
                        {formatMoneyVnd(amt)}
                      </td>
                      <td className="max-w-[180px] px-4 py-3">
                        <div className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                          {cname != null ? String(cname) : "—"}
                        </div>
                        {cid != null ? <div className="font-mono text-[11px] text-slate-500">#{cid}</div> : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {iid != null ? (
                          <Link
                            to={`${paths.invoicesList}/${encodeURIComponent(String(iid))}`}
                            className="text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{iid}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 pr-6 font-mono text-[11px] text-slate-600 dark:text-slate-400" title={refc != null ? String(refc) : ""}>
                        {refc != null ? String(refc) : "—"}
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
