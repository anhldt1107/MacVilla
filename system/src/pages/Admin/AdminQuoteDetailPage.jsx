import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { ROLE_ALIASES } from "@/config/roleRoutes.config";
import { fetchAdminUserRoles, fetchAdminUsers } from "@/services/admin/adminUsersApi";
import {
  ADMIN_QUOTE_DISCOUNT_TYPE_OPTIONS,
  adminQuoteStatusBadgeClass,
  approveAdminQuote,
  assignAdminQuoteSales,
  fetchAdminQuoteDetail,
  formatQuoteDiscount,
  labelAdminQuoteStatus,
  rejectAdminQuote,
  submitAdminQuoteForApproval,
  updateAdminQuote,
  convertAdminQuoteToOrder,
} from "@/services/admin/adminQuotesApi";
import { QuoteNotesHistorySection } from "@/components/Admin/quotes/QuoteNotesHistorySection";
import { QuoteStatusBanner } from "@/components/quotes/QuoteStatusBanner";
import { createAdminContract, fetchAdminContracts } from "@/services/admin/adminContractsApi";
import { fetchAdminCustomerDetail } from "@/services/admin/adminCustomersApi";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  FileSignature,
  FileSpreadsheet,
  Loader2,
  PencilLine,
  Save,
  Search,
  Send,
  ShoppingCart,
  Undo2,
  UserPlus,
  UserRound,
  XCircle,
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
import { buildContractCreateValidity } from "@/lib/contractValidity";
import { cn } from "@/lib/utils";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const CONVERT_ORDER_PAYMENT_OPTIONS = [
  { value: "Cash", label: "Tiền mặt" },
  { value: "BankTransfer", label: "Chuyển khoản" },
];

/** @param {object} row @param {string} camel @param {string} pascal */
function pickQuoteAux(row, camel, pascal) {
  if (!row || typeof row !== "object") return undefined;
  return /** @type {unknown} */ (row[camel] ?? row[pascal]);
}

/** Tên role API (lowercase) được map bucket `saler` trong `ROLE_ALIASES`. */
const SALER_ROLE_NAME_SET = new Set(
  Object.entries(ROLE_ALIASES)
    .filter(([, bucket]) => bucket === "saler")
    .map(([name]) => name.toLowerCase())
);

/** @param {{ id: number; roleName: string }[]} roles */
function findSalerRoleInList(roles) {
  return roles.find((r) => SALER_ROLE_NAME_SET.has(String(r.roleName || "").trim().toLowerCase()));
}

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

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-pulse" aria-hidden>
      <div className="h-4 w-2/3 max-w-md rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-12 w-full max-w-xl rounded-xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
          <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-800/70" />
        </div>
        <div className="space-y-4">
          <div className="h-56 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        </div>
      </div>
    </div>
  );
}

function staffLabel(staff) {
  if (!staff) return null;
  return staff.fullName ?? (staff.id != null ? `#${staff.id}` : null);
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

const rejectReasonTextareaClass = cn(
  "min-h-[100px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-foreground shadow-sm",
  "placeholder:text-slate-400 focus-visible:border-red-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/15",
  "dark:border-slate-700 dark:bg-slate-950"
);

const draftFieldClass = cn(
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-foreground shadow-sm",
  "focus-visible:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20",
  "dark:border-slate-700 dark:bg-slate-950"
);

const draftSelectClass = cn(draftFieldClass, "cursor-pointer appearance-none bg-transparent pr-8");

function isoToDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function datetimeLocalToIso(local) {
  if (!local || !String(local).trim()) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Chi tiết báo giá B2B — GET /api/admin/quotes/:id
 */
export function AdminQuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, user } = useAuth();
  const paths = useStaffShellPaths();
  const isSalesShell = paths.shell === "saler";
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  const [submitApprovalLoading, setSubmitApprovalLoading] = useState(false);
  const [submitApprovalError, setSubmitApprovalError] = useState("");
  const [approveQuoteLoading, setApproveQuoteLoading] = useState(false);
  const [approveQuoteError, setApproveQuoteError] = useState("");
  const [counterOfferReassignLoading, setCounterOfferReassignLoading] = useState(false);
  const [counterOfferReassignError, setCounterOfferReassignError] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReasonDraft, setRejectReasonDraft] = useState("Hủy");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectFormError, setRejectFormError] = useState("");

  const [contractFromQuoteOpen, setContractFromQuoteOpen] = useState(false);
  const [contractFromQuoteLoading, setContractFromQuoteLoading] = useState(false);
  const [contractFromQuoteError, setContractFromQuoteError] = useState("");
  const [contractFromQuoteValidFrom, setContractFromQuoteValidFrom] = useState("");
  const [contractFromQuoteValidTo, setContractFromQuoteValidTo] = useState("");

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertBootstrapLoading, setConvertBootstrapLoading] = useState(false);
  const [convertSubmitting, setConvertSubmitting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [convertAddresses, setConvertAddresses] = useState([]);
  const [convertContracts, setConvertContracts] = useState([]);
  const [convertShippingId, setConvertShippingId] = useState("");
  const [convertPaymentMethod, setConvertPaymentMethod] = useState("BankTransfer");
  const [convertNote, setConvertNote] = useState("");
  const [convertContractId, setConvertContractId] = useState("");

  const [draftEditLines, setDraftEditLines] = useState([]);
  const [draftDiscountType, setDraftDiscountType] = useState("Percentage");
  const [draftDiscountValue, setDraftDiscountValue] = useState("");
  const [draftValidUntil, setDraftValidUntil] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftSaveLoading, setDraftSaveLoading] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState("");

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminQuoteDetail(accessToken, id);
      setQuote(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được chi tiết báo giá.";
      setError(msg);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!quote) return;
    if (quote.status !== "Draft") {
      setDraftEditLines([]);
      return;
    }
    setDraftEditLines(
      (quote.lines ?? []).map((l) => ({
        id: l.id,
        variantId: l.variantId,
        quantity: String(l.quantity ?? ""),
        unitPrice: String(l.unitPrice ?? ""),
        productName: l.productName,
        variantName: l.variantName,
        currentSku: l.currentSku,
        imageUrl: l.imageUrl,
      }))
    );
    const dt = quote.discountType || "";
    setDraftDiscountType(dt === "FixedAmount" || dt === "Percentage" ? dt : "Percentage");
    setDraftDiscountValue(quote.discountValue != null ? String(quote.discountValue) : "");
    setDraftValidUntil(isoToDatetimeLocal(quote.validUntil));
    setDraftNotes(quote.notes ?? "");
    setDraftSaveError("");
  }, [quote]);

  const setDraftLineField = (index, field, value) => {
    setDraftEditLines((rows) => {
      const next = [...rows];
      if (!next[index]) return rows;
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveDraftQuote = async () => {
    if (!accessToken || !id || draftSaveLoading || quote?.status !== "Draft") return;
    if (draftEditLines.length < 1) {
      setDraftSaveError("Cần ít nhất một dòng hàng.");
      return;
    }
    const linesPayload = [];
    for (let i = 0; i < draftEditLines.length; i++) {
      const row = draftEditLines[i];
      const quantity = Number(row.quantity);
      const unitPrice = Number(row.unitPrice);
      if (!Number.isFinite(quantity) || quantity < 1) {
        setDraftSaveError(`Dòng ${i + 1}: số lượng phải ≥ 1.`);
        return;
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        setDraftSaveError(`Dòng ${i + 1}: đơn giá không hợp lệ.`);
        return;
      }
      linesPayload.push({
        id: row.id,
        variantId: row.variantId,
        quantity,
        unitPrice,
      });
    }
    let discountType = null;
    let discountValue = null;
    const dvRaw = draftDiscountValue.trim();
    if (dvRaw !== "") {
      const dv = Number(dvRaw);
      if (!Number.isFinite(dv) || dv < 0) {
        setDraftSaveError("Giá trị chiết khấu không hợp lệ.");
        return;
      }
      discountValue = dv;
      discountType = draftDiscountType || "Percentage";
    }
    setDraftSaveLoading(true);
    setDraftSaveError("");
    try {
      const updated = await updateAdminQuote(accessToken, id, {
        lines: linesPayload,
        discountType,
        discountValue,
        validUntil: datetimeLocalToIso(draftValidUntil),
        notes: draftNotes.trim() === "" ? null : draftNotes.trim(),
      });
      setQuote(updated);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Lưu báo giá thất bại.";
      setDraftSaveError(msg);
    } finally {
      setDraftSaveLoading(false);
    }
  };

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
        const msg =
          e instanceof ApiRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Không tải được danh sách vai trò.";
        setAssignRoleError(msg);
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
          const msg =
            e instanceof ApiRequestError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Không tải được danh sách saler.";
          setAssignPickError(msg);
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

  const handleSubmitForApproval = async () => {
    if (!accessToken || !id || submitApprovalLoading) return;
    if (quote?.status !== "Draft") return;
    setSubmitApprovalLoading(true);
    setSubmitApprovalError("");
    try {
      const updated = await submitAdminQuoteForApproval(accessToken, id);
      setQuote(updated);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Gửi duyệt thất bại.";
      setSubmitApprovalError(msg);
    } finally {
      setSubmitApprovalLoading(false);
    }
  };

  const handleReassignCurrentSalesToDraft = async () => {
    if (!accessToken || !id || counterOfferReassignLoading) return;
    if (quote?.status !== "CounterOffer") return;
    const salesId = quote?.sales?.id;
    if (salesId == null) {
      setCounterOfferReassignError("Không có nhân viên sale trên báo giá — không thể gán lại về nháp.");
      return;
    }
    setCounterOfferReassignLoading(true);
    setCounterOfferReassignError("");
    try {
      const updated = await assignAdminQuoteSales(accessToken, id, { salesId });
      setQuote(updated);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không chuyển được về chế độ chỉnh sửa.";
      setCounterOfferReassignError(msg);
    } finally {
      setCounterOfferReassignLoading(false);
    }
  };

  const canCreateContractFromQuote =
    quote?.status === "CustomerAccepted" || (!isSalesShell && quote?.status === "Approved");

  const submitContractFromQuote = useCallback(async () => {
    if (!accessToken || !id) return;
    if (isSalesShell && quote?.status !== "CustomerAccepted") return;
    setContractFromQuoteLoading(true);
    setContractFromQuoteError("");
    try {
      const created = await createAdminContract(accessToken, {
        quoteId: Number(id),
        sendForCustomerConfirmation: false,
        ...buildContractCreateValidity(contractFromQuoteValidFrom, contractFromQuoteValidTo),
        paymentTerms: null,
        attachmentUrl: null,
        notes: null,
      });
      setContractFromQuoteOpen(false);
      const nid = created?.id ?? created?.Id;
      if (nid != null) navigate(`${paths.contractsList}/${nid}`);
    } catch (e) {
      setContractFromQuoteError(
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tạo hợp đồng thất bại."
      );
    } finally {
      setContractFromQuoteLoading(false);
    }
  }, [
    accessToken,
    id,
    isSalesShell,
    quote?.status,
    contractFromQuoteValidFrom,
    contractFromQuoteValidTo,
    navigate,
    paths.contractsList,
  ]);

  const openConvertToOrderDialog = useCallback(async () => {
    if (!accessToken || !id || quote?.status !== "CustomerAccepted") return;
    setConvertDialogOpen(true);
    setConvertBootstrapLoading(true);
    setConvertError("");
    setConvertSubmitting(false);
    setConvertNote("");
    setConvertContractId("");
    setConvertPaymentMethod("BankTransfer");
    const custId = quote?.customer?.id;
    if (custId == null) {
      setConvertBootstrapLoading(false);
      setConvertAddresses([]);
      setConvertContracts([]);
      setConvertShippingId("");
      setConvertError("Báo giá thiếu khách hàng — không thể chuyển đơn.");
      return;
    }
    try {
      const [cust, ctrList] = await Promise.all([
        fetchAdminCustomerDetail(accessToken, custId),
        fetchAdminContracts(accessToken, { quoteId: Number(id), pageSize: 50 }),
      ]);
      const addrs = Array.isArray(cust?.addresses) ? cust.addresses : [];
      setConvertAddresses(addrs);
      const def = addrs.find((a) => a.isDefault) ?? addrs[0];
      setConvertShippingId(def?.id != null ? String(def.id) : "");
      setConvertContracts(Array.isArray(ctrList?.items) ? ctrList.items : []);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được dữ liệu chuyển đơn.";
      setConvertError(msg);
      setConvertAddresses([]);
      setConvertContracts([]);
      setConvertShippingId("");
    } finally {
      setConvertBootstrapLoading(false);
    }
  }, [accessToken, id, quote?.status, quote?.customer?.id]);

  const handleConvertToOrderSubmit = async () => {
    if (!accessToken || !id || convertSubmitting) return;
    const sid = Number(convertShippingId);
    if (!Number.isFinite(sid) || sid < 1) {
      setConvertError("Chọn địa chỉ giao hàng.");
      return;
    }
    setConvertSubmitting(true);
    setConvertError("");
    try {
      const order = await convertAdminQuoteToOrder(accessToken, id, {
        shippingAddressId: sid,
        paymentMethod: convertPaymentMethod,
        note: convertNote.trim() || null,
        contractId: convertContractId.trim() ? Number(convertContractId) : null,
      });
      setConvertDialogOpen(false);
      const oid = order?.id ?? order?.Id;
      if (oid != null) navigate(`${paths.ordersList}/${encodeURIComponent(String(oid))}`);
      else navigate(paths.ordersList);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Chuyển đơn thất bại.";
      setConvertError(msg);
    } finally {
      setConvertSubmitting(false);
    }
  };

  const onConvertDialogOpenChange = (open) => {
    setConvertDialogOpen(open);
    if (!open) {
      setConvertError("");
      setConvertBootstrapLoading(false);
    }
  };

  const handleApproveQuote = async () => {
    if (!accessToken || !id || approveQuoteLoading) return;
    if (quote?.status !== "PendingApproval") return;
    setApproveQuoteLoading(true);
    setApproveQuoteError("");
    try {
      const updated = await approveAdminQuote(accessToken, id);
      setQuote(updated);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Duyệt báo giá thất bại.";
      setApproveQuoteError(msg);
    } finally {
      setApproveQuoteLoading(false);
    }
  };

  const openRejectDialog = () => {
    setRejectReasonDraft("Hủy");
    setRejectFormError("");
    setRejectDialogOpen(true);
  };

  const onRejectDialogOpenChange = (open) => {
    setRejectDialogOpen(open);
    if (!open) setRejectFormError("");
  };

  const handleRejectConfirm = async () => {
    if (!accessToken || !id || rejectSubmitting) return;
    const trimmed = rejectReasonDraft.trim();
    if (!trimmed) {
      setRejectFormError("Vui lòng nhập lý do từ chối.");
      return;
    }
    setRejectSubmitting(true);
    setRejectFormError("");
    try {
      const updated = await rejectAdminQuote(accessToken, id, { rejectReason: trimmed });
      setQuote(updated);
      setRejectDialogOpen(false);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Từ chối báo giá thất bại.";
      setRejectFormError(msg);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleAssignPick = async (userId) => {
    if (!accessToken || !id || assignSubmittingId != null) return;
    setAssignSubmittingId(userId);
    setAssignActionError("");
    try {
      const updated = await assignAdminQuoteSales(accessToken, id, { salesId: userId });
      setQuote(updated);
      setAssignOpen(false);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Gán sale thất bại.";
      setAssignActionError(msg);
    } finally {
      setAssignSubmittingId(null);
    }
  };

  const assignListBusy = assignRoleLoading || assignPickLoading;
  const assignListErr = assignRoleError || assignPickError;

  if (!id) {
    return <div className="mx-auto max-w-7xl text-sm text-muted-foreground">Thiếu mã báo giá trên đường dẫn.</div>;
  }

  const lines = quote?.lines ?? [];
  const customer = quote?.customer;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link
          to={paths.root}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="px-1.5 py-0.5 text-slate-400 dark:text-slate-500">Bán hàng</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={paths.quotesList}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Báo giá (B2B)
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="max-w-[min(100%,14rem)] truncate px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
          {quote?.quoteCode ?? `#${id}`}
        </span>
      </nav>

      {loading && !quote ? <DetailSkeleton /> : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && quote ? (
        <>
          <header className="border-b border-slate-200/90 pb-8 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-800 ring-1 ring-indigo-500/20 dark:text-indigo-300">
                    <FileSpreadsheet className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <h1 className="font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {quote.quoteCode}
                  </h1>
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
                  Tạo lúc <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(quote.createdAt)}</span>
                  {quote.validUntil ? (
                    <>
                      {" "}
                      · Hiệu lực đến{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(quote.validUntil)}</span>
                    </>
                  ) : null}
                </p>
                {quote.status === "Draft" ? (
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <Button
                      type="button"
                      size="sm"
                      className="w-fit gap-1.5 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
                      disabled={submitApprovalLoading || draftSaveLoading}
                      onClick={() => void handleSubmitForApproval()}
                    >
                      {submitApprovalLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Send className="h-4 w-4" aria-hidden />
                      )}
                      Gửi duyệt
                    </Button>
                    {submitApprovalError ? (
                      <p className="text-sm text-red-600 dark:text-red-400">{submitApprovalError}</p>
                    ) : null}
                  </div>
                ) : null}
                {quote.status === "PendingApproval" && !isSalesShell ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <Button
                        type="button"
                        size="sm"
                        className="w-fit gap-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
                        disabled={approveQuoteLoading || rejectSubmitting || rejectDialogOpen}
                        onClick={() => void handleApproveQuote()}
                      >
                        {approveQuoteLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <BadgeCheck className="h-4 w-4" aria-hidden />
                        )}
                        Duyệt báo giá
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit gap-1.5 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                        disabled={approveQuoteLoading || rejectSubmitting}
                        onClick={openRejectDialog}
                      >
                        <XCircle className="h-4 w-4" aria-hidden />
                        Từ chối
                      </Button>
                    </div>
                    {approveQuoteError ? (
                      <p className="text-sm text-red-600 dark:text-red-400">{approveQuoteError}</p>
                    ) : null}
                  </div>
                ) : null}
                {quote.status === "CounterOffer" ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <Button
                        type="button"
                        size="sm"
                        className="w-fit gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-500"
                        disabled={counterOfferReassignLoading || quote.sales?.id == null}
                        onClick={() => void handleReassignCurrentSalesToDraft()}
                      >
                        {counterOfferReassignLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Undo2 className="h-4 w-4" aria-hidden />
                        )}
                        {isSalesShell ? "Tinh chỉnh báo giá" : "Chuyển về chỉnh sửa"}
                      </Button>
                    </div>
                    {counterOfferReassignError ? (
                      <p className="text-sm text-red-600 dark:text-red-400">{counterOfferReassignError}</p>
                    ) : quote.sales?.id == null ? (
                      <p className="text-xs text-amber-700 dark:text-amber-300">Chưa gán nhân viên kinh doanh phụ trách.</p>
                    ) : null}
                  </div>
                ) : null}
                <QuoteStatusBanner status={quote.status} isSalesShell={isSalesShell} />
                {quote.status === "CustomerAccepted" || (quote.status === "Approved" && !isSalesShell) ? (
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    {canCreateContractFromQuote ? (
                      <Button
                        type="button"
                        size="sm"
                        className="w-fit gap-1.5 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-700 dark:hover:bg-teal-600"
                        onClick={() => {
                          setContractFromQuoteError("");
                          setContractFromQuoteValidFrom("");
                          setContractFromQuoteValidTo("");
                          setContractFromQuoteOpen(true);
                        }}
                      >
                        <FileSignature className="h-4 w-4" aria-hidden />
                        Tạo hợp đồng
                      </Button>
                    ) : null}
                    {quote.status === "CustomerAccepted" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="w-fit gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        disabled={convertDialogOpen && convertBootstrapLoading}
                        onClick={() => void openConvertToOrderDialog()}
                      >
                        <ShoppingCart className="h-4 w-4" aria-hidden />
                        Chuyển thành đơn hàng
                      </Button>
                    ) : null}
                    <Link
                      to={`${paths.contractsList}?quoteId=${encodeURIComponent(String(id))}`}
                      className="text-xs text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                    >
                      Danh sách hợp đồng (lọc theo báo giá này)
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-right dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thanh toán dự kiến</p>
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

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="overflow-hidden border-slate-200/80 shadow-md dark:border-slate-800 dark:shadow-none">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base">Dòng hàng ({lines.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                          <th className="px-4 py-3 pl-5">Sản phẩm</th>
                          <th className="px-4 py-3 text-right">SL</th>
                          <th className="px-4 py-3 text-right">Đơn giá</th>
                          <th className="px-4 py-3 pr-5 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lines.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                              Không có dòng hàng.
                            </td>
                          </tr>
                        ) : (
                          lines.map((line, idx) => (
                            <tr key={line.id ?? idx} className={idx % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-900/20" : undefined}>
                              <td className="px-4 py-3.5 pl-5 align-middle">
                                <div className="flex gap-3">
                                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                    {line.imageUrl ? (
                                      <img
                                        src={line.imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">—</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-900 dark:text-slate-100">{line.productName ?? "—"}</p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{line.variantName ?? ""}</p>
                                    <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-500">
                                      {line.currentSku ?? `Biến thể #${line.variantId}`}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle tabular-nums">{line.quantity}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle font-mono text-sm tabular-nums text-slate-700 dark:text-slate-300">
                                {formatMoneyVnd(line.unitPrice)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 pr-5 text-right align-middle font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                                {formatMoneyVnd(line.subTotal)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {quote.status === "Draft" ? (
                <Card className="border-indigo-200/90 shadow-sm dark:border-indigo-900/45">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                        <PencilLine className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <CardTitle className="text-base">Chỉnh sửa báo giá (nháp)</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 p-5">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                            <th className="px-3 py-2.5 pl-4">Sản phẩm</th>
                            <th className="w-28 px-3 py-2.5 text-right">SL</th>
                            <th className="w-36 px-3 py-2.5 pr-4 text-right">Đơn giá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {draftEditLines.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                                Không có dòng hàng để chỉnh.
                              </td>
                            </tr>
                          ) : (
                            draftEditLines.map((row, idx) => (
                              <tr key={`${row.id}-${row.variantId}-${idx}`}>
                                <td className="px-3 py-3 pl-4 align-middle">
                                  <p className="font-medium text-slate-900 dark:text-slate-100">{row.productName ?? "—"}</p>
                                  <p className="truncate text-xs text-slate-500">{row.variantName ?? ""}</p>
                                  <p className="text-[11px] text-slate-500">{row.currentSku ?? `Biến thể #${row.variantId}`}</p>
                                </td>
                                <td className="px-3 py-3 align-middle">
                                  <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    className={cn(draftFieldClass, "text-right tabular-nums")}
                                    value={row.quantity}
                                    onChange={(e) => setDraftLineField(idx, "quantity", e.target.value)}
                                    disabled={draftSaveLoading}
                                    aria-label={`Số lượng dòng ${idx + 1}`}
                                  />
                                </td>
                                <td className="px-3 py-3 pr-4 align-middle">
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    className={cn(draftFieldClass, "text-right font-mono tabular-nums")}
                                    value={row.unitPrice}
                                    onChange={(e) => setDraftLineField(idx, "unitPrice", e.target.value)}
                                    disabled={draftSaveLoading}
                                    aria-label={`Đơn giá dòng ${idx + 1}`}
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="draft-discount-type">
                          Loại chiết khấu
                        </label>
                        <div className="relative">
                          <select
                            id="draft-discount-type"
                            className={draftSelectClass}
                            value={draftDiscountType}
                            onChange={(e) => setDraftDiscountType(e.target.value)}
                            disabled={draftSaveLoading}
                          >
                            {ADMIN_QUOTE_DISCOUNT_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="draft-discount-value">
                          Giá trị chiết khấu
                        </label>
                        <input
                          id="draft-discount-value"
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Để trống = không chiết khấu"
                          className={draftFieldClass}
                          value={draftDiscountValue}
                          onChange={(e) => setDraftDiscountValue(e.target.value)}
                          disabled={draftSaveLoading}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="draft-valid-until">
                          Hiệu lực đến
                        </label>
                        <input
                          id="draft-valid-until"
                          type="datetime-local"
                          className={cn(draftFieldClass, "max-w-md")}
                          value={draftValidUntil}
                          onChange={(e) => setDraftValidUntil(e.target.value)}
                          disabled={draftSaveLoading}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="draft-notes">
                          Ghi chú
                        </label>
                        <textarea
                          id="draft-notes"
                          className={rejectReasonTextareaClass}
                          rows={3}
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          disabled={draftSaveLoading}
                        />
                      </div>
                    </div>

                    {draftSaveError ? (
                      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                        {draftSaveError}
                      </p>
                    ) : null}

                    <Button
                      type="button"
                      className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      disabled={draftSaveLoading || draftEditLines.length < 1}
                      onClick={() => void handleSaveDraftQuote()}
                    >
                      {draftSaveLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                      Lưu báo giá
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <QuoteNotesHistorySection quote={quote} hideInternalNotes={quote.status === "Draft"} />
            </div>

            <div className="space-y-6">
              <Card className="border-slate-200/80 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                  <UserRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
                  <CardTitle className="text-base">Khách hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {customer ? (
                    <>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        <Link
                          to={`${paths.customersList}/${customer.id}`}
                          className="text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-400"
                        >
                          {customer.fullName ?? `Khách #${customer.id}`}
                        </Link>
                      </p>
                      {customer.companyName ? (
                        <p className="text-slate-600 dark:text-slate-400">{customer.companyName}</p>
                      ) : null}
                      <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                        {customer.phone ? <p>SĐT: {customer.phone}</p> : null}
                        {customer.email ? <p>Email: {customer.email}</p> : null}
                        {customer.taxCode ? <p>MST: {customer.taxCode}</p> : null}
                        {customer.companyAddress ? <p>Địa chỉ: {customer.companyAddress}</p> : null}
                        {customer.customerType ? (
                          <p>
                            Loại:{" "}
                            <span className="font-medium text-slate-800 dark:text-slate-200">{customer.customerType}</span>
                          </p>
                        ) : null}
                        {customer.debtBalance != null ? (
                          <p>
                            Công nợ: <span className="tabular-nums font-medium">{formatMoneyVnd(customer.debtBalance)}</span>
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500">Không có thông tin khách.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 dark:border-slate-800">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle className="text-base">Nhân sự</CardTitle>
                  </div>
                  {!isSalesShell ? (
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      onClick={() => openAssignDialog()}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      {isQuoteSalesUnassigned(quote) ? "Tiếp nhận báo giá" : "Đổi nhân viên sale"}
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sale</p>
                    <p className="mt-0.5 text-slate-900 dark:text-slate-100">{staffLabel(quote.sales) ?? "—"}</p>
                    {quote.sales?.phone ? (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">SĐT: {quote.sales.phone}</p>
                    ) : null}
                    {quote.sales?.email ? (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={quote.sales.email}>
                        {quote.sales.email}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quản lý</p>
                    <p className="mt-0.5 text-slate-900 dark:text-slate-100">{staffLabel(quote.manager) ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Link
                  to={paths.quotesList}
                  className="text-sm font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                >
                  ← Quay lại danh sách báo giá
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <Dialog open={convertDialogOpen} onOpenChange={onConvertDialogOpenChange}>
        <DialogContent className="max-h-[min(90vh,640px)] gap-0 overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chuyển báo giá thành đơn hàng</DialogTitle>
            <DialogDescription>
              Báo giá <span className="font-mono font-semibold text-foreground">{quote?.quoteCode ?? `#${id}`}</span> — chỉ áp dụng khi trạng thái là Khách chấp nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-1 py-2">
            {convertBootstrapLoading ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600/80" aria-hidden />
                <span className="text-sm">Đang tải địa chỉ giao & hợp đồng…</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="convert-ship-id">
                    Địa chỉ giao hàng
                  </label>
                  {convertAddresses.length === 0 ? (
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Khách chưa có địa chỉ giao trong hồ sơ.
                      {quote?.customer?.id != null ? (
                        <>
                          {" "}
                          <Link
                            to={`${paths.customersList}/${quote.customer.id}`}
                            className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                          >
                            Thêm tại hồ sơ khách
                          </Link>
                        </>
                      ) : null}
                    </p>
                  ) : (
                    <select
                      id="convert-ship-id"
                      className={draftSelectClass}
                      value={convertShippingId}
                      onChange={(e) => setConvertShippingId(e.target.value)}
                      disabled={convertSubmitting}
                    >
                      {convertAddresses.map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          {(a.receiverName ?? "—") + " · " + (a.receiverPhone ?? "—") + " — " + (a.addressLine ?? "")}
                          {a.isDefault ? " (mặc định)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="convert-pay-method">
                    Phương thức thanh toán
                  </label>
                  <select
                    id="convert-pay-method"
                    className={draftSelectClass}
                    value={convertPaymentMethod}
                    onChange={(e) => setConvertPaymentMethod(e.target.value)}
                    disabled={convertSubmitting}
                  >
                    {CONVERT_ORDER_PAYMENT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="convert-contract-id">
                    Hợp đồng (tuỳ chọn)
                  </label>
                  <select
                    id="convert-contract-id"
                    className={draftSelectClass}
                    value={convertContractId}
                    onChange={(e) => setConvertContractId(e.target.value)}
                    disabled={convertSubmitting}
                  >
                    <option value="">Không gắn hợp đồng</option>
                    {convertContracts
                      .filter((c) => {
                        const st = String(pickQuoteAux(c, "status", "Status") ?? "")
                          .trim()
                          .toLowerCase();
                        return st === "confirmed" || st === "active";
                      })
                      .map((c) => {
                        const cid = pickQuoteAux(c, "id", "Id");
                        const num = pickQuoteAux(c, "contractNumber", "ContractNumber");
                        const st = pickQuoteAux(c, "status", "Status");
                        return (
                          <option key={String(cid)} value={String(cid)}>
                            {(num ?? `#${cid}`) + " — " + (st ?? "")}
                          </option>
                        );
                      })}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chỉ liệt kê hợp đồng đã xác nhận hoặc đang hiệu lực. Chọn hợp đồng phù hợp nếu bắt buộc.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="convert-note">
                    Ghi chú đơn (tuỳ chọn)
                  </label>
                  <textarea
                    id="convert-note"
                    className={rejectReasonTextareaClass}
                    rows={3}
                    value={convertNote}
                    onChange={(e) => setConvertNote(e.target.value)}
                    disabled={convertSubmitting}
                    placeholder="Gửi kèm khi tạo đơn…"
                  />
                </div>
              </>
            )}
            {convertError ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {convertError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={convertSubmitting} onClick={() => onConvertDialogOpenChange(false)}>
              Đóng
            </Button>
            <Button
              type="button"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              disabled={
                convertSubmitting ||
                convertBootstrapLoading ||
                convertAddresses.length === 0 ||
                !convertShippingId.trim()
              }
              onClick={() => void handleConvertToOrderSubmit()}
            >
              {convertSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Xác nhận chuyển đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contractFromQuoteOpen} onOpenChange={setContractFromQuoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo hợp đồng từ báo giá</DialogTitle>
            <DialogDescription>
              Tạo hợp đồng nháp từ báo giá{" "}
              <span className="font-mono font-semibold text-foreground">{quote?.quoteCode ?? `#${id}`}</span>. Bạn có thể chỉnh và gửi khách xác nhận sau tại trang chi tiết hợp đồng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="cfq-valid-from">
                  Hiệu lực từ
                </label>
                <input
                  id="cfq-valid-from"
                  type="date"
                  className={fieldInput}
                  value={contractFromQuoteValidFrom}
                  onChange={(e) => setContractFromQuoteValidFrom(e.target.value)}
                  disabled={contractFromQuoteLoading}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="cfq-valid-to">
                  Hiệu lực đến
                </label>
                <input
                  id="cfq-valid-to"
                  type="date"
                  className={fieldInput}
                  value={contractFromQuoteValidTo}
                  onChange={(e) => setContractFromQuoteValidTo(e.target.value)}
                  disabled={contractFromQuoteLoading}
                />
              </div>
            </div>
            {contractFromQuoteError ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {contractFromQuoteError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={contractFromQuoteLoading} onClick={() => setContractFromQuoteOpen(false)}>
              Đóng
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              disabled={contractFromQuoteLoading}
              onClick={() => void submitContractFromQuote()}
            >
              {contractFromQuoteLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Tạo hợp đồng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={onRejectDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối báo giá</DialogTitle>
            <DialogDescription>
              Lý do sẽ được gửi lên máy chủ cùng báo giá (có thể để mặc định « Hủy » hoặc ghi rõ hơn).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="quote-reject-reason">
              Lý do từ chối
            </label>
            <textarea
              id="quote-reject-reason"
              className={rejectReasonTextareaClass}
              value={rejectReasonDraft}
              onChange={(e) => setRejectReasonDraft(e.target.value)}
              rows={4}
              disabled={rejectSubmitting}
            />
            {rejectFormError ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {rejectFormError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={rejectSubmitting} onClick={() => onRejectDialogOpenChange(false)}>
              Hủy thao tác
            </Button>
            <Button
              type="button"
              className="gap-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
              disabled={rejectSubmitting}
              onClick={() => void handleRejectConfirm()}
            >
              {rejectSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Xác nhận từ chối
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
    </div>
  );
}
