import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { createAdminWarrantyTicket } from "@/services/admin/adminWarrantyApi";
import { fetchAdminCustomers } from "@/services/admin/adminCustomersApi";
import { fetchAdminContracts } from "@/services/admin/adminContractsApi";
import { fetchAdminOrders, labelOrderStatus } from "@/services/admin/adminOrdersApi";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function pickRow(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function fromDatetimeLocalToIso(local) {
  const t = String(local || "").trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function emptyCreateForm() {
  return {
    customerId: "",
    orderId: "",
    contractId: "",
    validUntil: "",
  };
}

/**
 * @param {object} p
 * @param {boolean} p.open
 * @param {(open: boolean) => void} p.onOpenChange
 * @param {string} p.warrantyBasePath — ví dụ `/admin/after-sales/warranty` (không có slash cuối)
 * @param {() => void} [p.onSuccess] — gọi sau tạo thành công (vd. load lại list)
 * @param {{ customerId?: string, orderId?: string }} [p.openSeed] — gán khi mở dialog từ bộ lọc
 * @param {string} [p.description] — mô tả dưới tiêu đề
 */
export function WarrantyTicketCreateDialog({
  open,
  onOpenChange,
  warrantyBasePath,
  onSuccess,
  openSeed,
  description,
}) {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState(emptyCreateForm);

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

  const wasOpen = useRef(false);

  const resetWarrantyCreatePicker = useCallback(() => {
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

  useEffect(() => {
    if (open && !wasOpen.current) {
      const c = (openSeed?.customerId && String(openSeed.customerId).trim()) || "";
      const o = (openSeed?.orderId && String(openSeed.orderId).trim()) || "";
      setCreateForm({
        ...emptyCreateForm(),
        customerId: c && /^\d+$/.test(c) ? c : "",
        orderId: o && /^\d+$/.test(o) ? o : "",
      });
      resetWarrantyCreatePicker();
      setCreateError("");
    }
    wasOpen.current = open;
  }, [open, openSeed, resetWarrantyCreatePicker]);

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
    if (!open || !accessToken || !createCustSearchDebounced.trim()) {
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
  }, [accessToken, open, createCustSearchDebounced]);

  useEffect(() => {
    if (!open || !accessToken || !createOrdGlobDebounced.trim()) {
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
  }, [accessToken, open, createOrdGlobDebounced]);

  useEffect(() => {
    if (!open || !accessToken) return;
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
  }, [accessToken, open, createForm.customerId, createOrdByCustDebounced]);

  const clearWarrantyCreateCustomer = useCallback(() => {
    setCreateForm((f) => ({ ...f, customerId: "", orderId: "", contractId: "" }));
    setCreateCustomerSummary("");
    setCreateOrderSummary("");
    setCreateContractSummary("");
  }, []);

  const clearWarrantyCreateOrder = useCallback(() => {
    setCreateForm((f) => ({ ...f, orderId: "" }));
    setCreateOrderSummary("");
  }, []);

  const clearWarrantyCreateContract = useCallback(() => {
    setCreateForm((f) => ({ ...f, contractId: "" }));
    setCreateContractSummary("");
  }, []);

  const applyWarrantyCreateCustomerHit = useCallback((row) => {
    const id = pickRow(row, "id", "Id");
    const fn = pickRow(row, "fullName", "FullName");
    const phone = pickRow(row, "phone", "Phone");
    if (id == null || !Number.isFinite(Number(id))) return;
    setCreateForm((f) => ({ ...f, customerId: String(Number(id)), orderId: "", contractId: "" }));
    const bits = [fn != null ? String(fn) : "", phone != null ? String(phone) : ""].filter(Boolean);
    setCreateCustomerSummary(bits.join(" · ") || `Khách #${id}`);
    setCreateOrderSummary("");
    setCreateContractSummary("");
    setCreateCustSearchInput("");
    setCreateCustSearchDebounced("");
    setCreateCustHits([]);
  }, []);

  const applyWarrantyCreateOrderRow = useCallback((o) => {
    const oid = pickRow(o, "id", "Id");
    const cid = pickRow(o, "customerId", "CustomerId");
    const cname = pickRow(o, "customerName", "CustomerName");
    const code = pickRow(o, "orderCode", "OrderCode");
    const ost = pickRow(o, "orderStatus", "OrderStatus");
    if (cid == null || !Number.isFinite(Number(cid))) return;
    const oidStr = oid != null && Number.isFinite(Number(oid)) ? String(Number(oid)) : "";
    setCreateForm((f) => ({
      ...f,
      customerId: String(Number(cid)),
      orderId: oidStr,
      contractId: "",
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
  }, []);

  const applyWarrantyCreateOrderForCustomerOnly = useCallback((o) => {
    const oid = pickRow(o, "id", "Id");
    const code = pickRow(o, "orderCode", "OrderCode");
    const ost = pickRow(o, "orderStatus", "OrderStatus");
    if (oid == null || !Number.isFinite(Number(oid))) return;
    setCreateForm((f) => ({ ...f, orderId: String(Number(oid)) }));
    setCreateOrderSummary(
      code != null ? `${String(code)} · ${labelOrderStatus(ost != null ? String(ost) : "")}` : `Đơn #${oid}`
    );
  }, []);

  const applyWarrantyCreateContractRow = useCallback((row) => {
    const id = pickRow(row, "id", "Id");
    const num = pickRow(row, "contractNumber", "ContractNumber");
    if (id == null || !Number.isFinite(Number(id))) return;
    setCreateForm((f) => ({ ...f, contractId: String(Number(id)) }));
    setCreateContractSummary(num != null ? String(num) : `HĐ #${id}`);
  }, []);

  const handleOpenChange = (next) => {
    if (!next) {
      setCreateError("");
      setCreateForm(emptyCreateForm());
      resetWarrantyCreatePicker();
    }
    onOpenChange(next);
  };

  const submitCreate = async () => {
    if (!accessToken || createSubmitting) return;
    const cust = Number(createForm.customerId);
    if (!Number.isFinite(cust) || cust < 1) {
      setCreateError("Chọn hoặc nhập mã khách hàng hợp lệ.");
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      /** @type {Record<string, unknown>} */
      const body = { customerId: cust };
      const oid = createForm.orderId.trim();
      if (oid && /^\d+$/.test(oid)) body.orderId = Number(oid);
      const ct = createForm.contractId.trim();
      if (ct && /^\d+$/.test(ct)) body.contractId = Number(ct);
      const vu = fromDatetimeLocalToIso(createForm.validUntil);
      if (vu) body.validUntil = vu;

      const created = await createAdminWarrantyTicket(accessToken, body);
      const raw = created && typeof created === "object" ? /** @type {Record<string, unknown>} */ (created) : {};
      const newId = raw.id ?? raw.Id;
      setCreateError("");
      setCreateForm(emptyCreateForm());
      resetWarrantyCreatePicker();
      onOpenChange(false);
      onSuccess?.();
      if (newId != null && Number.isFinite(Number(newId))) {
        const base = String(warrantyBasePath || "").replace(/\/$/, "");
        navigate(`${base}/${Number(newId)}`);
      }
    } catch (e) {
      setCreateError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Tạo phiếu thất bại."
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const defaultDescription =
    "Chọn khách, đơn hoặc hợp đồng; có thể tìm theo mã đơn.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:max-w-2xl"
        onPointerDownOutside={(e) => createSubmitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tạo phiếu bảo hành</DialogTitle>
          <DialogDescription>{description ?? defaultDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-teal-200/70 bg-teal-50/40 p-3 dark:border-teal-900/40 dark:bg-teal-950/20">
            <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400" htmlFor="wtd-ord-glob">
              Tìm theo mã đơn (nhanh nhất)
            </label>
            <input
              id="wtd-ord-glob"
              type="search"
              className={fieldInput}
              placeholder="Gõ mã đơn (orderCode) hoặc từ khóa…"
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
                  const xoid = pickRow(row, "id", "Id");
                  const code = pickRow(row, "orderCode", "OrderCode");
                  const cname = pickRow(row, "customerName", "CustomerName");
                  const ost = pickRow(row, "orderStatus", "OrderStatus");
                  return (
                    <li key={xoid != null ? String(xoid) : idx}>
                      <button
                        type="button"
                        className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                        disabled={createSubmitting}
                        onClick={() => applyWarrantyCreateOrderRow(row)}
                      >
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {code != null ? String(code) : xoid != null ? `#${xoid}` : "—"}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={createSubmitting}
                  onClick={clearWarrantyCreateCustomer}
                >
                  Đổi khách
                </Button>
              ) : null}
            </div>
            {createForm.customerId.trim() && /^\d+$/.test(createForm.customerId.trim()) ? (
              <div className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {createCustomerSummary || "Đã chọn khách"}
                  </p>
                  <p className="text-xs text-slate-500">Mã khách: {createForm.customerId}</p>
                </div>
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
                      const rid = pickRow(row, "id", "Id");
                      const fn = pickRow(row, "fullName", "FullName");
                      const phone = pickRow(row, "phone", "Phone");
                      return (
                        <li key={rid != null ? String(rid) : idx}>
                          <button
                            type="button"
                            className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                            disabled={createSubmitting}
                            onClick={() => applyWarrantyCreateCustomerHit(row)}
                          >
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {fn != null ? String(fn) : `#${rid}`}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {phone != null ? String(phone) : ""}
                              {rid != null ? <span className="font-mono text-slate-500"> · #{rid}</span> : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : createCustSearchDebounced.trim() && !createCustSearchLoading ? (
                  <p className="text-xs text-slate-500">Không thấy khách.</p>
                ) : (
                  <p className="text-xs text-slate-500">Gõ ít nhất vài ký tự để tìm khách.</p>
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      disabled={createSubmitting}
                      onClick={clearWarrantyCreateOrder}
                    >
                      <X className="h-3 w-3" aria-hidden />
                      Bỏ đơn
                    </Button>
                  ) : null}
                </div>
                {createForm.orderId.trim() && /^\d+$/.test(createForm.orderId.trim()) ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {createOrderSummary || `Đơn #${createForm.orderId}`}
                    </p>
                    <p className="text-xs text-slate-500">Mã đơn: {createForm.orderId}</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="search"
                      className={fieldInput}
                      placeholder="Lọc đơn của khách (mã đơn)…"
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
                          const ooid = pickRow(row, "id", "Id");
                          const code = pickRow(row, "orderCode", "OrderCode");
                          const ost = pickRow(row, "orderStatus", "OrderStatus");
                          return (
                            <li key={ooid != null ? String(ooid) : idx}>
                              <button
                                type="button"
                                className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                                disabled={createSubmitting}
                                onClick={() => applyWarrantyCreateOrderForCustomerOnly(row)}
                              >
                                <span className="font-mono font-semibold">
                                  {code != null ? String(code) : `#${ooid}`}
                                </span>
                                <span className="text-xs text-slate-600">
                                  {labelOrderStatus(ost != null ? String(ost) : "")}
                                </span>
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      disabled={createSubmitting}
                      onClick={clearWarrantyCreateContract}
                    >
                      <X className="h-3 w-3" aria-hidden />
                      Bỏ HĐ
                    </Button>
                  ) : null}
                </div>
                {createForm.contractId.trim() && /^\d+$/.test(createForm.contractId.trim()) ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {createContractSummary || `HĐ #${createForm.contractId}`}
                    </p>
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
                      const crid = pickRow(row, "id", "Id");
                      const num = pickRow(row, "contractNumber", "ContractNumber");
                      const st = pickRow(row, "status", "Status");
                      return (
                        <li key={crid != null ? String(crid) : idx}>
                          <button
                            type="button"
                            className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                            disabled={createSubmitting}
                            onClick={() => applyWarrantyCreateContractRow(row)}
                          >
                            <span className="font-mono font-semibold">{num != null ? String(num) : `#${crid}`}</span>
                            <span className="text-xs text-slate-600">{st != null ? String(st) : ""}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">Khách chưa có hợp đồng.</p>
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
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="wtd-cust">
                    customerId
                  </label>
                  <input
                    id="wtd-cust"
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
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="wtd-ord">
                    orderId
                  </label>
                  <input
                    id="wtd-ord"
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
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="wtd-ct">
                    contractId
                  </label>
                  <input
                    id="wtd-ct"
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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="wtd-until">
              Hiệu lực đến (để trống: mặc định 12 tháng)
            </label>
            <input
              id="wtd-until"
              type="datetime-local"
              className={fieldInput}
              value={createForm.validUntil}
              onChange={(e) => setCreateForm((f) => ({ ...f, validUntil: e.target.value }))}
              disabled={createSubmitting}
            />
          </div>
        </div>
        {createError ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {createError}
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={createSubmitting} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={createSubmitting} onClick={() => void submitCreate()}>
            {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Tạo phiếu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
