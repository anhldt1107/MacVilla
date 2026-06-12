import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  createAdminInvoice,
  fetchAdminInvoiceStatuses,
  fetchAdminInvoices,
  invoiceStatusBadgeClass,
  labelAdminInvoiceStatus,
} from "@/services/admin/adminInvoicesApi";
import { fetchAdminCustomerDetail, fetchAdminCustomers } from "@/services/admin/adminCustomersApi";
import { fetchAdminContracts } from "@/services/admin/adminContractsApi";
import { fetchAdminOrderDetail, fetchAdminOrders, labelOrderStatus } from "@/services/admin/adminOrdersApi";
import { ChevronDown, ChevronLeft, ChevronRight, Download, Loader2, Plus, Receipt, RefreshCw, X } from "lucide-react";
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
import { formatVndMoneyInput, parseVndMoneyInput } from "@/lib/vndMoneyInput";
import { staffOrderDetailHref, staffOrderListRowCode } from "@/lib/staffOrderRoutes";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const fieldSelect = cn(fieldInput, "cursor-pointer appearance-none bg-transparent pr-10");

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(iso);
  }
}

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Thứ Hai tuần chứa `d` (local). */
function mondayOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function sundayAfterMonday(mon) {
  const e = new Date(mon);
  e.setDate(e.getDate() + 6);
  return e;
}

function pickRow(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/** Địa chỉ xuất HĐ: ưu tiên trụ sở (companyAddress), sau đó địa chỉ mặc định / đầu tiên. */
function billingAddressFromCustomerDetail(d) {
  if (!d || typeof d !== "object") return "";
  const co = pickRow(d, "companyAddress", "CompanyAddress");
  if (co != null && String(co).trim()) return String(co).trim();
  const addrs = d.addresses ?? d.Addresses;
  if (!Array.isArray(addrs) || addrs.length === 0) return "";
  const def = addrs.find((a) => a && (a.isDefault === true || a.IsDefault === true));
  const pick = def ?? addrs[0];
  const line = pickRow(pick, "addressLine", "AddressLine");
  return line != null && String(line).trim() ? String(line).trim() : "";
}

/** B2B: tạm tính gợi ý = hàng hoá − giảm (cơ sở tính VAT); khác: ưu tiên payable. */
function invoiceSubTotalHintFromOrderRow(o) {
  const ctype = String(pickRow(o, "customerType", "CustomerType") ?? "").toUpperCase();
  const disc = Number(pickRow(o, "discountTotal", "DiscountTotal")) || 0;
  const merch = Number(pickRow(o, "merchandiseTotal", "MerchandiseTotal"));
  const payable = Number(pickRow(o, "payableTotal", "PayableTotal"));
  if (ctype === "B2B" && Number.isFinite(merch)) {
    return Math.max(0, merch - disc);
  }
  if (Number.isFinite(payable)) return payable;
  if (Number.isFinite(merch)) return merch;
  return null;
}

function dueCountdownLabel(dueIso) {
  if (!dueIso) return null;
  try {
    const due = new Date(dueIso).getTime();
    const now = Date.now();
    const ms = due - now;
    const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
    if (Number.isNaN(days)) return null;
    if (days > 0) return `Còn ${days} ngày`;
    if (days === 0) return "Đến hạn hôm nay";
    return `Quá hạn ${Math.abs(days)} ngày`;
  } catch {
    return null;
  }
}

function downloadInvoicesCsv(items, page) {
  const cols = [
    { key: "id", label: "id" },
    { key: "invoiceNumber", label: "invoiceNumber" },
    { key: "status", label: "status" },
    { key: "customerId", label: "customerId" },
    { key: "customerName", label: "customerName" },
    { key: "orderId", label: "orderId" },
    { key: "subTotal", label: "subTotal" },
    { key: "taxAmount", label: "taxAmount" },
    { key: "totalAmount", label: "totalAmount" },
    { key: "amountPaid", label: "amountPaid" },
    { key: "balanceDue", label: "balanceDue" },
    { key: "dueDate", label: "dueDate" },
    { key: "issueDate", label: "issueDate" },
  ];
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    if (/[";\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    cols.map((c) => esc(c.label)).join(";"),
    ...items.map((row) =>
      cols
        .map((c) => {
          const v = pickRow(row, c.key, c.key.charAt(0).toUpperCase() + c.key.slice(1));
          return esc(v);
        })
        .join(";")
    ),
  ];
  const blob = new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hoa-don-trang-${page}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function fromDatetimeLocalToIso(local) {
  const t = String(local || "").trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/**
 * Danh sách & tạo hóa đơn — .
 */
export function AdminInvoicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fromDueDate, setFromDueDate] = useState("");
  const [toDueDate, setToDueDate] = useState("");
  const [fromIssueDate, setFromIssueDate] = useState("");
  const [toIssueDate, setToIssueDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    customerId: "",
    orderId: "",
    contractId: "",
    taxCode: "",
    companyName: "",
    billingAddress: "",
    subTotal: "",
    taxAmount: "",
    dueDate: "",
  });

  const [createCustSearchInput, setCreateCustSearchInput] = useState("");
  const [createCustSearchDebounced, setCreateCustSearchDebounced] = useState("");
  const [createCustHits, setCreateCustHits] = useState([]);
  const [createCustSearchLoading, setCreateCustSearchLoading] = useState(false);
  const [createOrdGlobInput, setCreateOrdGlobInput] = useState("");
  const [createOrdGlobDebounced, setCreateOrdGlobDebounced] = useState("");
  const [createOrdGlobHits, setCreateOrdGlobHits] = useState([]);
  const [createOrdGlobLoading, setCreateOrdGlobLoading] = useState(false);
  const [createOrdByCustInput, setCreateOrdByCustInput] = useState("");
  const [createOrdByCustDebounced, setCreateOrdByCustDebounced] = useState("");
  const [createOrdByCustHits, setCreateOrdByCustHits] = useState([]);
  const [createOrdByCustLoading, setCreateOrdByCustLoading] = useState(false);
  const [createContractHits, setCreateContractHits] = useState([]);
  const [createContractLoading, setCreateContractLoading] = useState(false);
  const [createCustomerSummary, setCreateCustomerSummary] = useState("");
  const [createOrderSummary, setCreateOrderSummary] = useState("");
  const [createContractSummary, setCreateContractSummary] = useState("");
  const [createShowManualIds, setCreateShowManualIds] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = window.setTimeout(() => setCreateCustSearchDebounced(createCustSearchInput), 400);
    return () => window.clearTimeout(t);
  }, [createCustSearchInput]);

  useEffect(() => {
    const t = window.setTimeout(() => setCreateOrdGlobDebounced(createOrdGlobInput), 400);
    return () => window.clearTimeout(t);
  }, [createOrdGlobInput]);

  useEffect(() => {
    const t = window.setTimeout(() => setCreateOrdByCustDebounced(createOrdByCustInput), 400);
    return () => window.clearTimeout(t);
  }, [createOrdByCustInput]);

  useEffect(() => {
    if (!createOpen || !accessToken || !createCustSearchDebounced.trim()) {
      setCreateCustHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCreateCustSearchLoading(true);
      try {
        const r = await fetchAdminCustomers(accessToken, { page: 1, pageSize: 12, search: createCustSearchDebounced.trim() });
        if (!cancelled) setCreateCustHits(r.items ?? []);
      } catch {
        if (!cancelled) setCreateCustHits([]);
      } finally {
        if (!cancelled) setCreateCustSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, createOpen, createCustSearchDebounced]);

  useEffect(() => {
    if (!createOpen || !accessToken || !createOrdGlobDebounced.trim()) {
      setCreateOrdGlobHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCreateOrdGlobLoading(true);
      try {
        const r = await fetchAdminOrders(accessToken, { page: 1, pageSize: 12, search: createOrdGlobDebounced.trim() });
        if (!cancelled) setCreateOrdGlobHits(r.items ?? []);
      } catch {
        if (!cancelled) setCreateOrdGlobHits([]);
      } finally {
        if (!cancelled) setCreateOrdGlobLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, createOpen, createOrdGlobDebounced]);

  useEffect(() => {
    if (!createOpen || !accessToken) return;
    const cid = Number(createForm.customerId);
    if (!Number.isFinite(cid) || cid < 1) {
      setCreateOrdByCustHits([]);
      setCreateContractHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCreateOrdByCustLoading(true);
      setCreateContractLoading(true);
      try {
        const [or, cr] = await Promise.all([
          fetchAdminOrders(accessToken, {
            page: 1,
            pageSize: 20,
            customerId: cid,
            search: createOrdByCustDebounced.trim() || undefined,
          }),
          fetchAdminContracts(accessToken, { customerId: cid, page: 1, pageSize: 25 }),
        ]);
        if (!cancelled) {
          setCreateOrdByCustHits(or.items ?? []);
          setCreateContractHits(cr.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setCreateOrdByCustHits([]);
          setCreateContractHits([]);
        }
      } finally {
        if (!cancelled) {
          setCreateOrdByCustLoading(false);
          setCreateContractLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, createOpen, createForm.customerId, createOrdByCustDebounced]);

  useEffect(() => {
    const o = searchParams.get("orderId");
    if (o && /^\d+$/.test(o)) setOrderId(o);
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const opts = await fetchAdminInvoiceStatuses(accessToken);
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
  }, [status, customerId, orderId, fromDueDate, toDueDate, fromIssueDate, toIssueDate, search, pageSize]);

  const statusFilterOptions = useMemo(() => [{ value: "", label: "Tất cả trạng thái" }, ...statusOptions], [statusOptions]);

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
      const result = await fetchAdminInvoices(accessToken, {
        page,
        pageSize,
        status,
        customerId: cid && /^\d+$/.test(cid) ? cid : undefined,
        orderId: oid && /^\d+$/.test(oid) ? oid : undefined,
        fromDueDate: fromDueDate.trim() || undefined,
        toDueDate: toDueDate.trim() || undefined,
        fromIssueDate: fromIssueDate.trim() || undefined,
        toIssueDate: toIssueDate.trim() || undefined,
        search: search.trim() || undefined,
      });
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được danh sách hóa đơn.";
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
    status,
    customerId,
    orderId,
    fromDueDate,
    toDueDate,
    fromIssueDate,
    toIssueDate,
    search,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const items = data?.items ?? [];

  const applyThisWeekDue = () => {
    const mon = mondayOfWeek(new Date());
    const sun = sundayAfterMonday(mon);
    setFromDueDate(toYmd(mon));
    setToDueDate(toYmd(sun));
  };

  const clearFilters = () => {
    setStatus("");
    setCustomerId("");
    setOrderId("");
    setFromDueDate("");
    setToDueDate("");
    setFromIssueDate("");
    setToIssueDate("");
    setSearchInput("");
    setSearch("");
  };

  const hasActiveFilters = Boolean(
    status || customerId.trim() || orderId.trim() || fromDueDate || toDueDate || fromIssueDate || toIssueDate || searchInput.trim()
  );

  const resetInvoiceCreatePicker = useCallback(() => {
    setCreateCustSearchInput("");
    setCreateCustSearchDebounced("");
    setCreateCustHits([]);
    setCreateCustSearchLoading(false);
    setCreateOrdGlobInput("");
    setCreateOrdGlobDebounced("");
    setCreateOrdGlobHits([]);
    setCreateOrdGlobLoading(false);
    setCreateOrdByCustInput("");
    setCreateOrdByCustDebounced("");
    setCreateOrdByCustHits([]);
    setCreateOrdByCustLoading(false);
    setCreateContractHits([]);
    setCreateContractLoading(false);
    setCreateCustomerSummary("");
    setCreateOrderSummary("");
    setCreateContractSummary("");
    setCreateShowManualIds(false);
  }, []);

  const resetCreateForm = () => {
    resetInvoiceCreatePicker();
    setCreateForm({
      customerId: "",
      orderId: "",
      contractId: "",
      taxCode: "",
      companyName: "",
      billingAddress: "",
      subTotal: "",
      taxAmount: "",
      dueDate: "",
    });
  };

  /**
   * Khách / đơn B2B: điền MST, tên công ty, địa chỉ xuất HĐ từ hồ sơ (hoặc từ đơn);
   * với đơn B2B: gợi ý tạm tính = hàng − giảm, thuế = 10% tạm tính (chỉ khi ô thuế đang trống).
   */
  const enrichInvoiceCreateFormB2b = useCallback(
    async ({ customerId, orderId }) => {
      if (!accessToken) return;
      const oidNum =
        orderId != null && orderId !== "" && Number.isFinite(Number(orderId)) && Number(orderId) > 0
          ? Number(orderId)
          : null;
      let cidNum =
        customerId != null && customerId !== "" && Number.isFinite(Number(customerId)) && Number(customerId) > 0
          ? Number(customerId)
          : null;

      let orderDetail = null;
      if (oidNum) {
        try {
          orderDetail = await fetchAdminOrderDetail(accessToken, oidNum);
        } catch {
          orderDetail = null;
        }
      }

      const oc = orderDetail && typeof orderDetail === "object" ? orderDetail.customer ?? orderDetail.Customer : null;
      const b2bFromOrder = String(pickRow(oc, "customerType", "CustomerType") ?? "").toUpperCase() === "B2B";

      if (!cidNum && oc) {
        const fromOrder = pickRow(oc, "id", "Id");
        if (fromOrder != null && Number.isFinite(Number(fromOrder))) cidNum = Number(fromOrder);
      }

      let custDetail = null;
      if (cidNum) {
        try {
          custDetail = await fetchAdminCustomerDetail(accessToken, cidNum);
        } catch {
          custDetail = null;
        }
      }

      const b2bFromCust =
        custDetail && String(pickRow(custDetail, "customerType", "CustomerType") ?? "").toUpperCase() === "B2B";

      if (!b2bFromOrder && !b2bFromCust) return;

      setCreateForm((f) => {
        const next = { ...f };
        if (custDetail && b2bFromCust) {
          const tax = pickRow(custDetail, "taxCode", "TaxCode");
          const cn = pickRow(custDetail, "companyName", "CompanyName");
          const addr = billingAddressFromCustomerDetail(custDetail);
          if (!next.taxCode.trim() && tax != null) next.taxCode = String(tax);
          if (!next.companyName.trim() && cn != null) next.companyName = String(cn);
          if (!next.billingAddress.trim() && addr) next.billingAddress = addr;
        } else if (b2bFromOrder && oc && typeof oc === "object") {
          const tax = pickRow(oc, "taxCode", "TaxCode");
          const cn = pickRow(oc, "companyName", "CompanyName");
          if (!next.taxCode.trim() && tax != null) next.taxCode = String(tax);
          if (!next.companyName.trim() && cn != null) next.companyName = String(cn);
          if (!next.billingAddress.trim() && orderDetail) {
            const ship = orderDetail.shippingAddress ?? orderDetail.ShippingAddress;
            const line = pickRow(ship, "addressLine", "AddressLine");
            if (line) next.billingAddress = String(line);
          }
        }
        if (orderDetail && b2bFromOrder) {
          const merch = Number(pickRow(orderDetail, "merchandiseTotal", "MerchandiseTotal"));
          const disc = Number(pickRow(orderDetail, "discountTotal", "DiscountTotal")) || 0;
          const net = Number.isFinite(merch) ? Math.max(0, merch - disc) : null;
          if (!next.subTotal.trim() && net != null) next.subTotal = formatVndMoneyInput(net);
          if (!next.taxAmount.trim() && next.subTotal.trim()) {
            const base = parseVndMoneyInput(next.subTotal);
            if (Number.isFinite(base) && base >= 0) {
              next.taxAmount = formatVndMoneyInput(Math.round(base * 0.1));
            }
          }
        }
        return next;
      });
    },
    [accessToken]
  );

  const clearInvoiceCreateCustomer = useCallback(() => {
    setCreateForm((f) => ({ ...f, customerId: "", orderId: "", contractId: "" }));
    setCreateCustomerSummary("");
    setCreateOrderSummary("");
    setCreateContractSummary("");
  }, []);

  const clearInvoiceCreateOrder = useCallback(() => {
    setCreateForm((f) => ({ ...f, orderId: "" }));
    setCreateOrderSummary("");
  }, []);

  const clearInvoiceCreateContract = useCallback(() => {
    setCreateForm((f) => ({ ...f, contractId: "" }));
    setCreateContractSummary("");
  }, []);

  const applyInvoiceCreateCustomerHit = useCallback((row) => {
    const id = pickRow(row, "id", "Id");
    const fn = pickRow(row, "fullName", "FullName");
    const phone = pickRow(row, "phone", "Phone");
    const coName = pickRow(row, "companyName", "CompanyName");
    const tax = pickRow(row, "taxCode", "TaxCode");
    if (id == null || !Number.isFinite(Number(id))) return;
    setCreateForm((f) => ({
      ...f,
      customerId: String(Number(id)),
      orderId: "",
      contractId: "",
      companyName: f.companyName.trim() ? f.companyName : coName != null ? String(coName) : "",
      taxCode: f.taxCode.trim() ? f.taxCode : tax != null ? String(tax) : "",
    }));
    const bits = [fn != null ? String(fn) : "", phone != null ? String(phone) : ""].filter(Boolean);
    setCreateCustomerSummary(bits.join(" · ") || `Khách #${id}`);
    setCreateOrderSummary("");
    setCreateContractSummary("");
    setCreateCustSearchInput("");
    setCreateCustSearchDebounced("");
    setCreateCustHits([]);
    const ctype = String(pickRow(row, "customerType", "CustomerType") ?? "").toUpperCase();
    if (ctype === "B2B") void enrichInvoiceCreateFormB2b({ customerId: Number(id) });
  }, [enrichInvoiceCreateFormB2b]);

  const applyInvoiceCreateOrderRow = useCallback(
    (o) => {
      const oid = pickRow(o, "id", "Id");
      const cid = pickRow(o, "customerId", "CustomerId");
      const cname = pickRow(o, "customerName", "CustomerName");
      const code = pickRow(o, "orderCode", "OrderCode");
      const ost = pickRow(o, "orderStatus", "OrderStatus");
      if (cid == null || !Number.isFinite(Number(cid))) return;
      const oidStr = oid != null && Number.isFinite(Number(oid)) ? String(Number(oid)) : "";
      const hint = invoiceSubTotalHintFromOrderRow(o);
      setCreateForm((f) => ({
        ...f,
        customerId: String(Number(cid)),
        orderId: oidStr,
        contractId: "",
        subTotal: f.subTotal.trim() === "" && hint != null ? formatVndMoneyInput(hint) : f.subTotal,
      }));
      setCreateCustomerSummary(cname != null ? String(cname) : `Khách #${cid}`);
      setCreateOrderSummary(
        code != null
          ? `${String(code)} · ${labelOrderStatus(ost != null ? String(ost) : "")}`
          : oidStr
            ? `Đơn #${oidStr}`
            : ""
      );
      setCreateContractSummary("");
      void enrichInvoiceCreateFormB2b({
        customerId: Number(cid),
        orderId: oidStr ? Number(oidStr) : undefined,
      });
    },
    [enrichInvoiceCreateFormB2b]
  );

  const applyInvoiceCreateOrderForCustomerOnly = useCallback(
    (o) => {
      const oid = pickRow(o, "id", "Id");
      const code = pickRow(o, "orderCode", "OrderCode");
      const ost = pickRow(o, "orderStatus", "OrderStatus");
      const custId = pickRow(o, "customerId", "CustomerId");
      if (oid == null || !Number.isFinite(Number(oid))) return;
      const hint = invoiceSubTotalHintFromOrderRow(o);
      setCreateForm((f) => ({
        ...f,
        orderId: String(Number(oid)),
        subTotal: f.subTotal.trim() === "" && hint != null ? formatVndMoneyInput(hint) : f.subTotal,
      }));
      setCreateOrderSummary(
        code != null ? `${String(code)} · ${labelOrderStatus(ost != null ? String(ost) : "")}` : `Đơn #${oid}`
      );
      void enrichInvoiceCreateFormB2b({
        customerId: custId != null && Number.isFinite(Number(custId)) ? Number(custId) : undefined,
        orderId: Number(oid),
      });
    },
    [enrichInvoiceCreateFormB2b]
  );

  const applyInvoiceCreateContractRow = useCallback((row) => {
    const id = pickRow(row, "id", "Id");
    const num = pickRow(row, "contractNumber", "ContractNumber");
    if (id == null || !Number.isFinite(Number(id))) return;
    setCreateForm((f) => ({ ...f, contractId: String(Number(id)) }));
    setCreateContractSummary(num != null ? String(num) : `HĐ #${id}`);
  }, []);

  const submitCreate = async () => {
    if (!accessToken || createSubmitting) return;
    const cust = Number(createForm.customerId);
    if (!Number.isFinite(cust) || cust < 1) {
      setCreateError("Nhập mã khách hàng (customerId) hợp lệ.");
      return;
    }
    const sub = parseVndMoneyInput(createForm.subTotal);
    if (!Number.isFinite(sub) || sub < 0) {
      setCreateError("Tạm tính (subTotal) phải là số không âm.");
      return;
    }
    const taxAmt = createForm.taxAmount.trim() ? parseVndMoneyInput(createForm.taxAmount) : undefined;
    if (createForm.taxAmount.trim() && (!Number.isFinite(taxAmt) || taxAmt < 0)) {
      setCreateError("Thuế (taxAmount) không hợp lệ.");
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      /** @type {import("@/services/admin/adminInvoicesApi").AdminInvoiceCreatePayload} */
      const payload = { customerId: cust, subTotal: sub };
      const oid = createForm.orderId.trim();
      if (oid && /^\d+$/.test(oid)) payload.orderId = Number(oid);
      const ct = createForm.contractId.trim();
      if (ct && /^\d+$/.test(ct)) payload.contractId = Number(ct);
      const tt = createForm.taxCode.trim();
      if (tt) payload.taxCode = tt;
      const cn = createForm.companyName.trim();
      if (cn) payload.companyName = cn;
      const ba = createForm.billingAddress.trim();
      if (ba) payload.billingAddress = ba;
      if (taxAmt !== undefined) payload.taxAmount = taxAmt;
      const dueIso = fromDatetimeLocalToIso(createForm.dueDate);
      if (dueIso) payload.dueDate = dueIso;

      const created = await createAdminInvoice(accessToken, payload);
      const raw = created && typeof created === "object" ? /** @type {Record<string, unknown>} */ (created) : {};
      const newId = raw.id ?? raw.Id;
      setCreateOpen(false);
      resetCreateForm();
      if (newId != null && Number.isFinite(Number(newId))) {
        navigate(`${paths.invoicesList}/${Number(newId)}`);
      } else {
        navigate(paths.invoicesList);
      }
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tạo được hóa đơn.";
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
          className="max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:max-w-2xl"
          onPointerDownOutside={(e) => createSubmitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn VAT</DialogTitle>
            <DialogDescription>
              Chọn khách / đơn / hợp đồng từ danh sách. Có thể tìm theo mã đơn để điền nhanh khách, đơn và gợi ý tạm tính từ đơn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 rounded-xl border border-violet-200/80 bg-violet-50/50 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
              <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400" htmlFor="inv-ord-glob">
                Tìm theo mã đơn (nhanh)
              </label>
              <input
                id="inv-ord-glob"
                type="search"
                className={fieldInput}
                placeholder="Mã đơn hoặc từ khóa…"
                value={createOrdGlobInput}
                onChange={(e) => setCreateOrdGlobInput(e.target.value)}
                disabled={createSubmitting}
              />
              {createOrdGlobLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Đang tìm đơn…
                </div>
              ) : null}
              {createOrdGlobHits.length > 0 ? (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                  {createOrdGlobHits.map((row, idx) => {
                    const oid = pickRow(row, "id", "Id");
                    const code = pickRow(row, "orderCode", "OrderCode");
                    const cname = pickRow(row, "customerName", "CustomerName");
                    const ost = pickRow(row, "orderStatus", "OrderStatus");
                    return (
                      <li key={oid != null ? String(oid) : idx}>
                        <button
                          type="button"
                          className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                          disabled={createSubmitting}
                          onClick={() => applyInvoiceCreateOrderRow(row)}
                        >
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {code != null ? String(code) : oid != null ? `#${oid}` : "—"}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {cname != null ? String(cname) : "—"} · {labelOrderStatus(ost != null ? String(ost) : "")}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : createOrdGlobDebounced.trim() && !createOrdGlobLoading ? (
                <p className="text-xs text-slate-500">Không thấy đơn phù hợp.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Khách hàng <span className="text-red-600">*</span>
                </label>
                {createForm.customerId.trim() && /^\d+$/.test(createForm.customerId.trim()) ? (
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" disabled={createSubmitting} onClick={clearInvoiceCreateCustomer}>
                    Đổi khách
                  </Button>
                ) : null}
              </div>
              {createForm.customerId.trim() && /^\d+$/.test(createForm.customerId.trim()) ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {createCustomerSummary || "Đã chọn khách"}
                  </p>
                  <p className="text-xs text-slate-500">Mã khách: {createForm.customerId}</p>
                </div>
              ) : (
                <>
                  <input
                    type="search"
                    className={fieldInput}
                    placeholder="Tên, SĐT, email…"
                    value={createCustSearchInput}
                    onChange={(e) => setCreateCustSearchInput(e.target.value)}
                    disabled={createSubmitting}
                  />
                  {createCustSearchLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      Đang tìm…
                    </div>
                  ) : null}
                  {createCustHits.length > 0 ? (
                    <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                      {createCustHits.map((row, idx) => {
                        const id = pickRow(row, "id", "Id");
                        const fn = pickRow(row, "fullName", "FullName");
                        const phone = pickRow(row, "phone", "Phone");
                        return (
                          <li key={id != null ? String(id) : idx}>
                            <button
                              type="button"
                              className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                              disabled={createSubmitting}
                              onClick={() => applyInvoiceCreateCustomerHit(row)}
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
                  ) : createCustSearchDebounced.trim() && !createCustSearchLoading ? (
                    <p className="text-xs text-slate-500">Không thấy khách.</p>
                  ) : (
                    <p className="text-xs text-slate-500">Gõ vài ký tự để tìm khách.</p>
                  )}
                </>
              )}
            </div>

            {createForm.customerId.trim() && /^\d+$/.test(createForm.customerId.trim()) ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase text-slate-500">Đơn (tuỳ chọn)</label>
                    {createForm.orderId.trim() && /^\d+$/.test(createForm.orderId.trim()) ? (
                      <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" disabled={createSubmitting} onClick={clearInvoiceCreateOrder}>
                        <X className="h-3 w-3" aria-hidden />
                        Bỏ đơn
                      </Button>
                    ) : null}
                  </div>
                  {createForm.orderId.trim() && /^\d+$/.test(createForm.orderId.trim()) ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{createOrderSummary || `Đơn #${createForm.orderId}`}</p>
                      <p className="text-xs text-slate-500">Mã đơn: {createForm.orderId}</p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="search"
                        className={fieldInput}
                        placeholder="Lọc đơn của khách…"
                        value={createOrdByCustInput}
                        onChange={(e) => setCreateOrdByCustInput(e.target.value)}
                        disabled={createSubmitting}
                      />
                      {createOrdByCustLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          Đang tải đơn…
                        </div>
                      ) : null}
                      {createOrdByCustHits.length > 0 ? (
                        <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                          {createOrdByCustHits.map((row, idx) => {
                            const oid = pickRow(row, "id", "Id");
                            const code = pickRow(row, "orderCode", "OrderCode");
                            const ost = pickRow(row, "orderStatus", "OrderStatus");
                            return (
                              <li key={oid != null ? String(oid) : idx}>
                                <button
                                  type="button"
                                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                                  disabled={createSubmitting}
                                  onClick={() => applyInvoiceCreateOrderForCustomerOnly(row)}
                                >
                                  <span className="font-mono font-semibold">{code != null ? String(code) : `#${oid}`}</span>
                                  <span className="text-xs text-slate-600">{labelOrderStatus(ost != null ? String(ost) : "")}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500">Không có đơn hoặc chưa khớp bộ lọc.</p>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase text-slate-500">Hợp đồng (tuỳ chọn)</label>
                    {createForm.contractId.trim() && /^\d+$/.test(createForm.contractId.trim()) ? (
                      <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" disabled={createSubmitting} onClick={clearInvoiceCreateContract}>
                        <X className="h-3 w-3" aria-hidden />
                        Bỏ HĐ
                      </Button>
                    ) : null}
                  </div>
                  {createForm.contractId.trim() && /^\d+$/.test(createForm.contractId.trim()) ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{createContractSummary || `HĐ #${createForm.contractId}`}</p>
                      <p className="text-xs text-slate-500">Mã hợp đồng: {createForm.contractId}</p>
                    </div>
                  ) : createContractLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      Đang tải hợp đồng…
                    </div>
                  ) : createContractHits.length > 0 ? (
                    <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                      {createContractHits.map((row, idx) => {
                        const id = pickRow(row, "id", "Id");
                        const num = pickRow(row, "contractNumber", "ContractNumber");
                        const st = pickRow(row, "status", "Status");
                        return (
                          <li key={id != null ? String(id) : idx}>
                            <button
                              type="button"
                              className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                              disabled={createSubmitting}
                              onClick={() => applyInvoiceCreateContractRow(row)}
                            >
                              <span className="font-mono font-semibold">{num != null ? String(num) : `#${id}`}</span>
                              <span className="text-xs text-slate-600">{st != null ? String(st) : ""}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">Không có hợp đồng cho khách này.</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <button
                type="button"
                className="text-xs font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                onClick={() => setCreateShowManualIds((v) => !v)}
              >
                {createShowManualIds ? "Ẩn nhập ID thủ công" : "Nhập ID thủ công (nâng cao)"}
              </button>
              {createShowManualIds ? (
                <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-600">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-cust-man">
                      customerId
                    </label>
                    <input
                      id="inv-cust-man"
                      type="text"
                      inputMode="numeric"
                      className={fieldInput}
                      value={createForm.customerId}
                      onChange={(e) => {
                        setCreateForm((f) => ({ ...f, customerId: e.target.value }));
                        setCreateCustomerSummary("");
                      }}
                      disabled={createSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-ord-man">
                      orderId
                    </label>
                    <input
                      id="inv-ord-man"
                      type="text"
                      inputMode="numeric"
                      className={fieldInput}
                      value={createForm.orderId}
                      onChange={(e) => {
                        setCreateForm((f) => ({ ...f, orderId: e.target.value }));
                        setCreateOrderSummary("");
                      }}
                      disabled={createSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-ct-man">
                      contractId
                    </label>
                    <input
                      id="inv-ct-man"
                      type="text"
                      inputMode="numeric"
                      className={fieldInput}
                      value={createForm.contractId}
                      onChange={(e) => {
                        setCreateForm((f) => ({ ...f, contractId: e.target.value }));
                        setCreateContractSummary("");
                      }}
                      disabled={createSubmitting}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:grid-cols-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 sm:col-span-2">
                <strong>B2B:</strong> khi chọn khách hoặc đơn doanh nghiệp, hệ thống có thể tự điền MST, tên công ty và địa chỉ xuất hóa đơn. Kiểm tra lại tạm tính và thuế trước khi gửi.
              </p>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-tax">
                  Mã số thuế (MST)
                </label>
                <input
                  id="inv-tax"
                  type="text"
                  className={fieldInput}
                  value={createForm.taxCode}
                  onChange={(e) => setCreateForm((f) => ({ ...f, taxCode: e.target.value }))}
                  disabled={createSubmitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-comp">
                  Tên công ty
                </label>
                <input
                  id="inv-comp"
                  type="text"
                  className={fieldInput}
                  value={createForm.companyName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, companyName: e.target.value }))}
                  disabled={createSubmitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-addr">
                  Địa chỉ xuất HĐ
                </label>
                <input
                  id="inv-addr"
                  type="text"
                  className={fieldInput}
                  value={createForm.billingAddress}
                  onChange={(e) => setCreateForm((f) => ({ ...f, billingAddress: e.target.value }))}
                  disabled={createSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-sub">
                  Tạm tính (đ) <span className="text-red-600">*</span>
                </label>
                <input
                  id="inv-sub"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  className={cn(fieldInput, "tabular-nums")}
                  value={createForm.subTotal}
                  onChange={(e) => setCreateForm((f) => ({ ...f, subTotal: formatVndMoneyInput(e.target.value) }))}
                  disabled={createSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-taxamt">
                  Thuế (đ)
                </label>
                <input
                  id="inv-taxamt"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  className={cn(fieldInput, "tabular-nums")}
                  value={createForm.taxAmount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, taxAmount: formatVndMoneyInput(e.target.value) }))}
                  disabled={createSubmitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-due">
                  Hạn thanh toán
                </label>
                <input
                  id="inv-due"
                  type="datetime-local"
                  className={fieldInput}
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
                  disabled={createSubmitting}
                />
              </div>
            </div>
          </div>
          {createError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {createError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={createSubmitting} onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={createSubmitting} className="gap-1.5" onClick={() => void submitCreate()}>
              {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 py-3 px-4 sm:px-5 dark:border-slate-800">
          <CardTitle className="text-base font-semibold tracking-tight">Hóa đơn</CardTitle>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => {
              setCreateError("");
              resetCreateForm();
              setCreateForm({
                customerId: customerId.trim() && /^\d+$/.test(customerId.trim()) ? customerId.trim() : "",
                orderId: orderId.trim() && /^\d+$/.test(orderId.trim()) ? orderId.trim() : "",
                contractId: "",
                taxCode: "",
                companyName: "",
                billingAddress: "",
                subTotal: "",
                taxAmount: "",
                dueDate: "",
              });
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tạo hóa đơn
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={applyThisWeekDue}>
              Hạn thanh toán: tuần này
            </Button>
            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              to={paths.transferNotificationsList}
            >
              Thông báo CK B2B
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-st">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  id="inv-st"
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
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-cid">
                Khách (ID)
              </label>
              <input
                id="inv-cid"
                type="text"
                inputMode="numeric"
                className={fieldInput}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-oid">
                Đơn (ID)
              </label>
              <input
                id="inv-oid"
                type="text"
                inputMode="numeric"
                className={fieldInput}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-fdd">
                Hạn từ
              </label>
              <input id="inv-fdd" type="date" className={fieldInput} value={fromDueDate} onChange={(e) => setFromDueDate(e.target.value)} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-tdd">
                Hạn đến
              </label>
              <input id="inv-tdd" type="date" className={fieldInput} value={toDueDate} onChange={(e) => setToDueDate(e.target.value)} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-fid">
                Phát hành từ
              </label>
              <input id="inv-fid" type="date" className={fieldInput} value={fromIssueDate} onChange={(e) => setFromIssueDate(e.target.value)} />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-tid">
                Phát hành đến
              </label>
              <input id="inv-tid" type="date" className={fieldInput} value={toIssueDate} onChange={(e) => setToIssueDate(e.target.value)} />
            </div>
            <div className="space-y-2 lg:col-span-4">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="inv-q">
                Tìm kiếm
              </label>
              <input
                id="inv-q"
                type="search"
                placeholder="Số HĐ, tên khách…"
                className={fieldInput}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-12 lg:justify-end">
              <Button type="button" size="sm" className="gap-1.5" disabled={loading} onClick={() => load()}>
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
                onClick={() => downloadInvoicesCsv(items, page)}
              >
                <Download className="h-3.5 w-3.5" />
                Xuất CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200/80 shadow-md dark:border-slate-800">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <CardTitle className="text-lg font-semibold">
              {loading ? "Danh sách" : `Danh sách · ${totalCount.toLocaleString("vi-VN")} hóa đơn`}
            </CardTitle>
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
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3 pl-6">Số HĐ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Đơn</th>
                  <th className="px-4 py-3 text-right">Tổng / đã trả / còn</th>
                  <th className="px-4 py-3">Hạn</th>
                  <th className="px-4 py-3 pr-6">Phát hành</th>
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
                      Không có hóa đơn phù hợp.
                    </td>
                  </tr>
                ) : null}
                {items.map((row, idx) => {
                  const rid = pickRow(row, "id", "Id");
                  const num = pickRow(row, "invoiceNumber", "InvoiceNumber");
                  const st = pickRow(row, "status", "Status");
                  const cname = pickRow(row, "customerName", "CustomerName");
                  const cid = pickRow(row, "customerId", "CustomerId");
                  const oid = pickRow(row, "orderId", "OrderId");
                  const orderHref = staffOrderDetailHref(paths, {
                    orderId: oid,
                    orderCode: staffOrderListRowCode(row) ?? pickRow(row, "orderCode", "OrderCode"),
                  });
                  const sub = pickRow(row, "subTotal", "SubTotal");
                  const tax = pickRow(row, "taxAmount", "TaxAmount");
                  const tot = pickRow(row, "totalAmount", "TotalAmount");
                  const paid = pickRow(row, "amountPaid", "AmountPaid");
                  const bal = pickRow(row, "balanceDue", "BalanceDue");
                  const due = pickRow(row, "dueDate", "DueDate");
                  const iss = pickRow(row, "issueDate", "IssueDate");
                  const totalDisplay =
                    tot != null
                      ? formatMoneyVnd(tot)
                      : sub != null || tax != null
                        ? formatMoneyVnd(Number(sub || 0) + Number(tax || 0))
                        : "—";
                  const countdown = due ? dueCountdownLabel(String(due)) : null;
                  return (
                    <tr
                      key={rid != null ? String(rid) : idx}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
                        idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-900/20"
                      )}
                      onClick={() => rid != null && navigate(`${paths.invoicesList}/${rid}`)}
                    >
                      <td className="px-4 py-3 pl-6 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {num != null ? String(num) : rid != null ? `#${rid}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            invoiceStatusBadgeClass(st != null ? String(st) : "")
                          )}
                        >
                          {labelAdminInvoiceStatus(st != null ? String(st) : "", statusOptions)}
                        </span>
                        {countdown ? (
                          <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{countdown}</span>
                        ) : null}
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {cname != null ? String(cname) : "—"}
                        </div>
                        {cid != null ? <div className="font-mono text-[11px] text-slate-500">#{cid}</div> : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {orderHref ? (
                          <Link
                            to={orderHref}
                            className="text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Đơn {oid != null ? `#${oid}` : staffOrderListRowCode(row) ?? "—"}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                        <div className="font-semibold tabular-nums">{totalDisplay}</div>
                        {paid != null ? <div className="tabular-nums text-emerald-700 dark:text-emerald-400">Trả: {formatMoneyVnd(paid)}</div> : null}
                        {bal != null ? <div className="tabular-nums text-amber-800 dark:text-amber-300">Còn: {formatMoneyVnd(bal)}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(due != null ? String(due) : "")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 pr-6 text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(iss != null ? String(iss) : "")}
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
