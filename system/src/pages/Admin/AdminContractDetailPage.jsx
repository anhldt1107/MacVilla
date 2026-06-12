import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  adminContractStatusBadgeClass,
  cancelAdminContract,
  fetchAdminContractDetail,
  fetchAdminContractStatuses,
  labelAdminContractStatus,
  sendAdminContractForCustomerConfirmation,
  updateAdminContract,
} from "@/services/admin/adminContractsApi";
import {
  Ban,
  ChevronRight,
  FileSignature,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { ContractValiditySection } from "@/components/Admin/contracts/ContractValiditySection";
import { DocumentAttachmentPreview } from "@/components/Admin/DocumentAttachmentPreview";
import { DocumentUrlField } from "@/components/Admin/DocumentUrlField";
import {
  buildContractUpdatePayload,
  contractToFormFields,
  getContractValidityValidationError,
} from "@/lib/contractValidity";
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

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const textareaClass = cn(fieldInput, "min-h-[88px] resize-y py-2");

function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
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

function normalizeStatusKey(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** Cho phép sửa PUT theo guideline: Draft hoặc PendingConfirmation */
function isContractEditable(status) {
  const s = normalizeStatusKey(status);
  if (s === "draft") return true;
  if (s.includes("pending") && s.includes("confirm")) return true;
  return false;
}

function isDraftStatus(status) {
  return normalizeStatusKey(status) === "draft";
}

function isCancelledLike(status) {
  const s = normalizeStatusKey(status);
  return s.includes("cancel");
}

/**
 * Chi tiết hợp đồng admin — theo `dev/.../hop-dong.md`.
 */
export function AdminContractDetailPage() {
  const { id } = useParams();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

  const [form, setForm] = useState({
    validFrom: "",
    validTo: "",
    paymentTerms: "",
    attachmentUrl: "",
    notes: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const c = await fetchAdminContractDetail(accessToken, id);
      setContract(c);
      setForm(contractToFormFields(c));
    } catch (e) {
      setContract(null);
      setError(e instanceof ApiRequestError ? e.message : "Không tải được hợp đồng.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, id]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const status = useMemo(() => String(pick(contract, "status", "Status") ?? ""), [contract]);
  const contractNumber = pick(contract, "contractNumber", "ContractNumber") ?? `#${id}`;
  const quoteId = pick(contract, "quoteId", "QuoteId");
  const customerId = pick(contract, "customerId", "CustomerId");
  const customerName = pick(contract, "customerName", "CustomerName");
  const createdAt = pick(contract, "createdAt", "CreatedAt");

  const editable = isContractEditable(status);
  const draft = isDraftStatus(status);
  const cancelled = isCancelledLike(status);
  const validitySendError = useMemo(
    () => getContractValidityValidationError(form.validFrom, form.validTo),
    [form.validFrom, form.validTo]
  );

  const handleSave = async () => {
    if (!accessToken || !id || !editable) return;
    setSaveLoading(true);
    setSaveError("");
    try {
      const updated = await updateAdminContract(accessToken, id, buildContractUpdatePayload(form));
      setContract(updated);
      setForm(contractToFormFields(updated));
    } catch (e) {
      setSaveError(e instanceof ApiRequestError ? e.message : "Lưu thất bại.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSend = async () => {
    if (!accessToken || !id) return;
    const validityErr = getContractValidityValidationError(form.validFrom, form.validTo);
    if (validityErr) {
      setSendError(validityErr);
      return;
    }
    setSendLoading(true);
    setSendError("");
    try {
      if (editable) {
        const saved = await updateAdminContract(accessToken, id, buildContractUpdatePayload(form));
        setContract(saved);
        setForm(contractToFormFields(saved));
      }
      const updated = await sendAdminContractForCustomerConfirmation(accessToken, id);
      setContract(updated);
    } catch (e) {
      setSendError(e instanceof ApiRequestError ? e.message : "Gửi khách thất bại.");
    } finally {
      setSendLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!accessToken || !id) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      const updated = await cancelAdminContract(accessToken, id, {
        reason: cancelReason.trim() || null,
      });
      setContract(updated);
      setCancelOpen(false);
      setCancelReason("");
    } catch (e) {
      setCancelError(e instanceof ApiRequestError ? e.message : "Hủy hợp đồng thất bại.");
    } finally {
      setCancelLoading(false);
    }
  };

  const pagePad = paths.shell === "admin" ? "px-0" : "px-3 sm:px-4";

  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-4 pb-6", pagePad)}>
      <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Link to={paths.contractsList} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
          Hợp đồng
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="truncate px-1.5 font-semibold text-slate-800 dark:text-slate-200">{contractNumber}</span>
      </nav>

      {loading && !contract ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Đang tải…
        </div>
      ) : null}

      {error && !loading ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error && contract ? (
        <>
          <header className="space-y-2 border-b border-slate-200/90 pb-4 dark:border-slate-800">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-800 ring-1 ring-teal-500/20 dark:text-teal-300">
                  <FileSignature className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h1 className="font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">{contractNumber}</h1>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    adminContractStatusBadgeClass(status)
                  )}
                >
                  {labelAdminContractStatus(status, statusOptions)}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tạo lúc <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(createdAt)}</span>
                {quoteId != null ? (
                  <>
                    {" "}
                    · Báo giá{" "}
                    <Link className="font-mono text-indigo-700 hover:underline dark:text-indigo-400" to={`${paths.quotesList}/${quoteId}`}>
                      #{quoteId}
                    </Link>
                  </>
                ) : null}
                {customerId != null ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link className="text-indigo-700 hover:underline dark:text-indigo-400" to={`${paths.customersList}/${customerId}`}>
                      {customerName || `Khách #${customerId}`}
                    </Link>
                  </>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {draft && !cancelled ? (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                    disabled={sendLoading || !!validitySendError}
                    onClick={() => void handleSend()}
                  >
                    {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Gửi khách xác nhận
                  </Button>
                ) : null}
                {!cancelled ? (
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 border-red-200 text-red-700" onClick={() => setCancelOpen(true)}>
                    <Ban className="h-4 w-4" />
                    Hủy hợp đồng
                  </Button>
                ) : null}
              </div>
              {sendError ? <p className="text-sm text-red-600 dark:text-red-400">{sendError}</p> : null}
            </div>
          </header>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Nội dung hợp đồng</CardTitle>
              <CardDescription>
                {editable
                  ? "Cập nhật điều khoản, tài liệu và ghi chú trước khi gửi khách xác nhận."
                  : "Thông tin hợp đồng ở chế độ chỉ đọc."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
                <div className="space-y-5">
                  <ContractValiditySection
                    validFrom={form.validFrom}
                    validTo={form.validTo}
                    editable={editable}
                    onValidFromChange={(v) => setForm((f) => ({ ...f, validFrom: v }))}
                    onValidToChange={(v) => setForm((f) => ({ ...f, validTo: v }))}
                    fieldClassName={fieldInput}
                    requireBeforeSend={draft && !cancelled}
                    sendHint={draft && !cancelled && validitySendError ? validitySendError : null}
                    idPrefix="contract"
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="contract-payment-terms">
                      Điều khoản thanh toán
                    </label>
                    <input
                      id="contract-payment-terms"
                      className={fieldInput}
                      disabled={!editable}
                      value={form.paymentTerms}
                      onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                      placeholder="Ví dụ: Thanh toán trong 30 ngày sau khi xuất hóa đơn"
                    />
                  </div>
                  <DocumentUrlField
                    id="contract-attachment-url"
                    label="Tài liệu hợp đồng"
                    value={form.attachmentUrl}
                    onChange={(url) => setForm((f) => ({ ...f, attachmentUrl: url }))}
                    uploadFolder="contract"
                    disabled={!editable || saveLoading}
                    urlPlaceholder="https://… (PDF hoặc tài liệu hợp đồng)"
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="contract-notes">
                      Ghi chú
                    </label>
                    <textarea
                      id="contract-notes"
                      className={textareaClass}
                      disabled={!editable}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Ghi chú nội bộ hoặc gửi kèm khách…"
                    />
                  </div>
                  {saveError ? <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p> : null}
                  <Button type="button" disabled={!editable || saveLoading} onClick={() => void handleSave()} className="gap-2">
                    {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu thay đổi
                  </Button>
                </div>
                <DocumentAttachmentPreview url={form.attachmentUrl} />
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy hợp đồng?</DialogTitle>
            <DialogDescription>Hành động này sẽ hủy hợp đồng theo quy định trạng thái. Có thể ghi lý do (không bắt buộc).</DialogDescription>
          </DialogHeader>
          <label className="sr-only" htmlFor="contract-cancel-reason">
            Lý do hủy
          </label>
          <textarea
            id="contract-cancel-reason"
            className={textareaClass}
            placeholder="Lý do hủy (không bắt buộc)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          {cancelError ? <p className="text-sm text-red-600">{cancelError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelLoading}>
              Đóng
            </Button>
            <Button type="button" variant="destructive" disabled={cancelLoading} onClick={() => void handleCancel()}>
              {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
