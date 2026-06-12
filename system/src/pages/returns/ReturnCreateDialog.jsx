import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  createAdminReturn,
  labelAdminReturnType,
} from "@/services/admin/adminReturnsApi";
import { fetchAdminCustomers } from "@/services/admin/adminCustomersApi";
import { fetchAdminOrderDetail, fetchAdminOrders, labelOrderStatus } from "@/services/admin/adminOrdersApi";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ProductLineCell } from "@/components/catalog/ProductLineCell";
import { extractProductLineFields } from "@/lib/productLineFields";

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

export function emptyReturnItem() {
  return { orderItemId: "", variantIdReturned: "", variantIdExchanged: "", quantity: "1" };
}

export function emptyReturnCreateForm() {
  return {
    orderId: "",
    type: "Return",
    reason: "",
    customerNote: "",
    internalNote: "",
    items: [emptyReturnItem()],
  };
}

function normReturnType(t) {
  return String(t ?? "")
    .trim()
    .toLowerCase();
}

function orderLinesFromDetail(detail) {
  if (!detail || typeof detail !== "object") return [];
  const lines = detail.lines ?? detail.Lines ?? [];
  return Array.isArray(lines) ? lines : [];
}

function lineOrderItemId(line) {
  return pickRow(line, "id", "Id") ?? pickRow(line, "orderItemId", "OrderItemId");
}

function lineVariantId(line) {
  return pickRow(line, "variantId", "VariantId");
}

function lineReturnableQty(line) {
  const q = pickRow(line, "returnableQuantity", "ReturnableQuantity");
  const n = Number(q);
  if (Number.isFinite(n) && n >= 0) return n;
  return lineQty(line);
}

function lineQty(line) {
  const q = pickRow(line, "quantity", "Quantity");
  const n = Number(q);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function lineLabel(line) {
  const vid = lineVariantId(line);
  const pname = pickRow(line, "productName", "ProductName");
  const vname = pickRow(line, "variantName", "VariantName");
  const sku = pickRow(line, "currentSku", "CurrentSku") ?? pickRow(line, "skuSnapshot", "SkuSnapshot");
  const qty = pickRow(line, "quantity", "Quantity");
  const oid = lineOrderItemId(line);
  const retQ = lineReturnableQty(line);
  const bits = [pname != null ? String(pname) : null, vname != null ? String(vname) : null, sku != null ? String(sku) : null]
    .filter(Boolean)
    .join(" · ");
  return `${bits || "Biến thể"} — dòng #${oid != null ? String(oid) : "?"} (còn trả: ${retQ})`;
}

/**
 * Popup tạo phiếu đổi/trả — chọn đơn giống màn tạo phiếu bảo hành; dòng hàng chọn từ chi tiết đơn.
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   accessToken: string | null | undefined;
 *   typeOptions: { value: string; label: string }[];
 *   returnsBase: string;
 *   initialOrderId?: string;
 *   initialReturnType?: string;
 *   onCreated?: () => void;
 * }} props
 */
export function ReturnCreateDialog({
  open,
  onOpenChange,
  accessToken,
  typeOptions,
  returnsBase,
  initialOrderId = "",
  initialReturnType = "",
  onCreated,
}) {
  const navigate = useNavigate();
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState(emptyReturnCreateForm);

  const [createOrdGlobInput, setCreateOrdGlobInput] = useState("");
  const [createOrdGlobDebounced, setCreateOrdGlobDebounced] = useState("");
  const [createOrdGlobHits, setCreateOrdGlobHits] = useState([]);
  const [createOrdGlobLoading, setCreateOrdGlobLoading] = useState(false);

  const [createCustSearchInput, setCreateCustSearchInput] = useState("");
  const [createCustSearchDebounced, setCreateCustSearchDebounced] = useState("");
  const [createCustHits, setCreateCustHits] = useState([]);
  const [createCustSearchLoading, setCreateCustSearchLoading] = useState(false);
  const [pickerCustomerId, setPickerCustomerId] = useState("");
  const [createCustomerSummary, setCreateCustomerSummary] = useState("");

  const [createOrdByCustInput, setCreateOrdByCustInput] = useState("");
  const [createOrdByCustDebounced, setCreateOrdByCustDebounced] = useState("");
  const [createOrdByCustHits, setCreateOrdByCustHits] = useState([]);
  const [createOrdByCustLoading, setCreateOrdByCustLoading] = useState(false);

  const [createOrderSummary, setCreateOrderSummary] = useState("");
  const [orderDetail, setOrderDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [orderLinesLoading, setOrderLinesLoading] = useState(false);
  const [createShowManualOrderId, setCreateShowManualOrderId] = useState(false);

  const prevOpen = useRef(false);

  const resetSearchPickers = useCallback(() => {
    setCreateOrdGlobInput("");
    setCreateOrdGlobDebounced("");
    setCreateOrdGlobHits([]);
    setCreateOrdGlobLoading(false);
    setCreateCustSearchInput("");
    setCreateCustSearchDebounced("");
    setCreateCustHits([]);
    setCreateCustSearchLoading(false);
    setPickerCustomerId("");
    setCreateCustomerSummary("");
    setCreateOrdByCustInput("");
    setCreateOrdByCustDebounced("");
    setCreateOrdByCustHits([]);
    setCreateOrdByCustLoading(false);
    setCreateShowManualOrderId(false);
  }, []);

  const resetAllPickers = useCallback(() => {
    resetSearchPickers();
    setCreateOrderSummary("");
    setOrderDetail(null);
    setOrderLinesLoading(false);
  }, [resetSearchPickers]);

  useEffect(() => {
    const t = window.setTimeout(() => setCreateOrdGlobDebounced(createOrdGlobInput), 400);
    return () => window.clearTimeout(t);
  }, [createOrdGlobInput]);

  useEffect(() => {
    const t = window.setTimeout(() => setCreateCustSearchDebounced(createCustSearchInput), 400);
    return () => window.clearTimeout(t);
  }, [createCustSearchInput]);

  useEffect(() => {
    const t = window.setTimeout(() => setCreateOrdByCustDebounced(createOrdByCustInput), 400);
    return () => window.clearTimeout(t);
  }, [createOrdByCustInput]);

  useEffect(() => {
    if (open && !prevOpen.current) {
      const oid = String(initialOrderId ?? "").trim();
      const typ = String(initialReturnType ?? "").trim();
      setCreateForm({
        ...emptyReturnCreateForm(),
        orderId: oid && /^\d+$/.test(oid) ? oid : "",
        type: typ && typeOptions.some((o) => o.value === typ) ? typ : "Return",
        items: [emptyReturnItem()],
      });
      setCreateError("");
      resetSearchPickers();
      setCreateOrderSummary("");
      setOrderDetail(null);
    }
    if (!open) {
      resetAllPickers();
      setCreateForm(emptyReturnCreateForm());
      setCreateError("");
    }
    prevOpen.current = open;
  }, [open, initialOrderId, initialReturnType, typeOptions, resetSearchPickers, resetAllPickers]);

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
    if (!open || !accessToken) return;
    const cid = Number(pickerCustomerId);
    if (!Number.isFinite(cid) || cid < 1) {
      setCreateOrdByCustHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCreateOrdByCustLoading(true);
      try {
        const or = await fetchAdminOrders(accessToken, {
          page: 1,
          pageSize: 20,
          customerId: cid,
          search: createOrdByCustDebounced.trim() || undefined,
        });
        if (!cancelled) setCreateOrdByCustHits(or.items ?? []);
      } catch {
        if (!cancelled) setCreateOrdByCustHits([]);
      } finally {
        if (!cancelled) setCreateOrdByCustLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, open, pickerCustomerId, createOrdByCustDebounced]);

  const orderLines = useMemo(() => orderLinesFromDetail(orderDetail), [orderDetail]);

  const exchangeLineIdSet = useMemo(() => new Set(orderLines.map((l) => String(lineVariantId(l) ?? ""))), [orderLines]);

  useEffect(() => {
    if (!open || !accessToken) return;
    const oid = createForm.orderId.trim();
    if (!/^\d+$/.test(oid)) {
      setOrderDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setOrderLinesLoading(true);
      try {
        const d = await fetchAdminOrderDetail(accessToken, Number(oid));
        const raw = !cancelled && d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null;
        if (!cancelled) setOrderDetail(raw);
        if (!cancelled && raw) {
          const code = pickRow(raw, "orderCode", "OrderCode");
          const ost = pickRow(raw, "orderStatus", "OrderStatus");
          setCreateOrderSummary(
            code != null ? `${String(code)} · ${labelOrderStatus(ost != null ? String(ost) : "")}` : `Đơn #${oid}`
          );
          setCreateForm((f) => ({ ...f, items: [emptyReturnItem()] }));
        }
      } catch {
        if (!cancelled) setOrderDetail(null);
      } finally {
        if (!cancelled) setOrderLinesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, accessToken, createForm.orderId]);

  const applyOrderRow = useCallback((o) => {
    const oid = pickRow(o, "id", "Id");
    const cid = pickRow(o, "customerId", "CustomerId");
    const cname = pickRow(o, "customerName", "CustomerName");
    const code = pickRow(o, "orderCode", "OrderCode");
    const ost = pickRow(o, "orderStatus", "OrderStatus");
    if (oid == null || !Number.isFinite(Number(oid))) return;
    const oidStr = String(Number(oid));
    setCreateForm((f) => ({ ...f, orderId: oidStr }));
    if (cid != null && Number.isFinite(Number(cid))) {
      setPickerCustomerId(String(Number(cid)));
      setCreateCustomerSummary(cname != null ? String(cname) : `Khách #${cid}`);
    }
    setCreateOrderSummary(
      code != null
        ? `${String(code)} · ${labelOrderStatus(ost != null ? String(ost) : "")}`
        : `Đơn #${oidStr}`
    );
  }, []);

  const clearOrderSelection = useCallback(() => {
    setCreateForm((f) => ({ ...f, orderId: "" }));
    setCreateOrderSummary("");
    setOrderDetail(null);
  }, []);

  const clearCustomerPicker = useCallback(() => {
    setPickerCustomerId("");
    setCreateCustomerSummary("");
    setCreateOrdByCustHits([]);
    setCreateOrdByCustInput("");
  }, []);

  const createTypeSelect = useMemo(() => {
    if (typeOptions.length) return typeOptions;
    return [
      { value: "Return", label: "Trả hàng" },
      { value: "Exchange", label: "Đổi hàng" },
    ];
  }, [typeOptions]);

  const submitCreate = async () => {
    if (!accessToken || createSubmitting) return;
    const oid = Number(createForm.orderId);
    if (!Number.isFinite(oid) || oid < 1) {
      setCreateError("Chọn hoặc nhập mã đơn hàng (orderId) hợp lệ.");
      return;
    }
    const typ = createForm.type.trim();
    if (!typ) {
      setCreateError("Chọn loại phiếu.");
      return;
    }
    const rows = createForm.items.map((it) => ({
      oi: Number(it.orderItemId || it.variantIdReturned),
      vr: Number(it.variantIdReturned),
      ve: it.variantIdExchanged.trim() ? Number(it.variantIdExchanged) : null,
      q: Number(String(it.quantity).replace(/\s/g, "").replace(",", ".")),
    }));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!Number.isFinite(r.oi) || r.oi < 1) {
        setCreateError(`Dòng ${i + 1}: chọn dòng đơn hàng.`);
        return;
      }
      if (!Number.isFinite(r.vr) || r.vr < 1) {
        setCreateError(`Dòng ${i + 1}: chọn hoặc nhập biến thể trả hàng.`);
        return;
      }
      if (!Number.isFinite(r.q) || r.q < 1) {
        setCreateError(`Dòng ${i + 1}: số lượng phải ≥ 1.`);
        return;
      }
      if (normReturnType(typ) === "exchange") {
        if (r.ve == null || !Number.isFinite(r.ve) || r.ve < 1) {
          setCreateError(`Dòng ${i + 1}: đổi hàng cần biến thể nhận (đổi sang).`);
          return;
        }
      }
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      /** @type {Record<string, unknown>} */
      const body = {
        orderId: oid,
        type: typ,
        items: rows.map((r) => {
          const it = { orderItemId: r.oi, variantIdReturned: r.vr, quantity: r.q };
          if (r.ve != null && Number.isFinite(r.ve)) it.variantIdExchanged = r.ve;
          return it;
        }),
      };
      const rs = createForm.reason.trim();
      if (rs) body.reason = rs;
      const cn = createForm.customerNote.trim();
      if (cn) body.customerNote = cn;
      const inn = createForm.internalNote.trim();
      if (inn) body.internalNote = inn;

      const created = await createAdminReturn(accessToken, body);
      const raw = created && typeof created === "object" ? /** @type {Record<string, unknown>} */ (created) : {};
      const newId = raw.id ?? raw.Id;
      onOpenChange(false);
      onCreated?.();
      if (newId != null && Number.isFinite(Number(newId))) {
        navigate(`${returnsBase}/${Number(newId)}`);
      }
    } catch (e) {
      setCreateError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tạo phiếu thất bại.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const maxQtyForOrderItem = (orderItemIdStr) => {
    const oid = Number(orderItemIdStr);
    if (!Number.isFinite(oid)) return null;
    const line = orderLines.find((l) => Number(lineOrderItemId(l)) === oid);
    if (!line) return null;
    return lineReturnableQty(line);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setCreateError("");
          setCreateForm(emptyReturnCreateForm());
          resetAllPickers();
        }
      }}
    >
      <DialogContent
        className="max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:max-w-2xl"
        onPointerDownOutside={(e) => createSubmitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tạo phiếu đổi / trả</DialogTitle>
          <DialogDescription>Chọn đơn và các dòng hàng cần đổi/trả.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-teal-200/70 bg-teal-50/40 p-3 dark:border-teal-900/40 dark:bg-teal-950/20">
            <label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400" htmlFor="rtc-ord-glob">
              Tìm theo mã đơn (nhanh nhất)
            </label>
            <input
              id="rtc-ord-glob"
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
                  const roid = pickRow(row, "id", "Id");
                  const code = pickRow(row, "orderCode", "OrderCode");
                  const cname = pickRow(row, "customerName", "CustomerName");
                  const ost = pickRow(row, "orderStatus", "OrderStatus");
                  return (
                    <li key={roid != null ? String(roid) : idx}>
                      <button
                        type="button"
                        className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                        disabled={createSubmitting}
                        onClick={() => applyOrderRow(row)}
                      >
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {code != null ? String(code) : roid != null ? `#${roid}` : "—"}
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
                Khách hàng <span className="text-slate-400">(tuỳ chọn — lọc đơn)</span>
              </label>
              {pickerCustomerId ? (
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" disabled={createSubmitting} onClick={clearCustomerPicker}>
                  Đổi khách
                </Button>
              ) : null}
            </div>
            {pickerCustomerId ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{createCustomerSummary || "Đã chọn khách"}</p>
                <p className="text-xs text-slate-500">Mã khách: {pickerCustomerId}</p>
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
                            onClick={() => {
                              if (id == null || !Number.isFinite(Number(id))) return;
                              setPickerCustomerId(String(Number(id)));
                              setCreateCustomerSummary(fn != null ? String(fn) : `Khách #${id}`);
                            }}
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
                  <p className="text-xs text-slate-500">Gõ vài ký tự để tìm khách, rồi chọn đơn bên dưới.</p>
                )}
              </>
            )}
          </div>

          {pickerCustomerId ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase text-slate-500">Đơn của khách</label>
                {createForm.orderId.trim() && /^\d+$/.test(createForm.orderId.trim()) ? (
                  <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" disabled={createSubmitting} onClick={clearOrderSelection}>
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
                    placeholder="Lọc theo mã đơn…"
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
                        const roid = pickRow(row, "id", "Id");
                        const code = pickRow(row, "orderCode", "OrderCode");
                        const ost = pickRow(row, "orderStatus", "OrderStatus");
                        return (
                          <li key={roid != null ? String(roid) : idx}>
                            <button
                              type="button"
                              className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                              disabled={createSubmitting}
                              onClick={() => applyOrderRow(row)}
                            >
                              <span className="font-mono font-semibold">{code != null ? String(code) : `#${roid}`}</span>
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
          ) : null}

          <div className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-600">
            <button
              type="button"
              className="text-xs font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
              onClick={() => setCreateShowManualOrderId((v) => !v)}
            >
              {createShowManualOrderId ? "Ẩn nhập orderId thủ công" : "Nhập orderId thủ công (nâng cao)"}
            </button>
            {createShowManualOrderId ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rtc-ord-manual">
                  Đơn (orderId) <span className="text-red-600">*</span>
                </label>
                <input
                  id="rtc-ord-manual"
                  type="text"
                  inputMode="numeric"
                  className={fieldInput}
                  value={createForm.orderId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, orderId: e.target.value }))}
                  disabled={createSubmitting}
                />
              </div>
            ) : createForm.orderId.trim() && /^\d+$/.test(createForm.orderId.trim()) ? (
              <div className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{createOrderSummary || `Đơn #${createForm.orderId}`}</p>
                  <p className="text-xs text-slate-500">Mã đơn: {createForm.orderId}</p>
                  {orderLinesLoading ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      Đang tải dòng đơn…
                    </p>
                  ) : null}
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 text-xs" disabled={createSubmitting} onClick={clearOrderSelection}>
                  Đổi
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Chưa chọn đơn — dùng ô tìm mã đơn phía trên hoặc khách → đơn.</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rtc-type">
                Loại <span className="text-red-600">*</span>
              </label>
              <select
                id="rtc-type"
                className={fieldSelect}
                value={createForm.type}
                onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                disabled={createSubmitting}
              >
                {createTypeSelect.map((o) => (
                  <option key={o.value} value={o.value}>
                    {labelAdminReturnType(o.value, typeOptions)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rtc-reason">
                Lý do
              </label>
              <input
                id="rtc-reason"
                type="text"
                className={fieldInput}
                value={createForm.reason}
                onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))}
                disabled={createSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rtc-cn">
                Ghi chú khách
              </label>
              <textarea
                id="rtc-cn"
                rows={2}
                className={cn(fieldInput, "min-h-[72px] resize-y py-2")}
                value={createForm.customerNote}
                onChange={(e) => setCreateForm((f) => ({ ...f, customerNote: e.target.value }))}
                disabled={createSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="rtc-in">
                Ghi chú nội bộ
              </label>
              <textarea
                id="rtc-in"
                rows={2}
                className={cn(fieldInput, "min-h-[72px] resize-y py-2")}
                value={createForm.internalNote}
                onChange={(e) => setCreateForm((f) => ({ ...f, internalNote: e.target.value }))}
                disabled={createSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Dòng hàng (items)</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={createSubmitting}
                onClick={() => setCreateForm((f) => ({ ...f, items: [...f.items, emptyReturnItem()] }))}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Thêm dòng
              </Button>
            </div>
            {!orderLines.length && createForm.orderId.trim() && /^\d+$/.test(createForm.orderId.trim()) && !orderLinesLoading ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Không có dòng đơn hoặc không tải được chi tiết — dùng nhập ID biến thể thủ công bên dưới từng dòng.
              </p>
            ) : null}
            <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              {createForm.items.map((it, idx) => (
                <div key={idx} className="grid gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Dòng {idx + 1}</span>
                    {createForm.items.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-600"
                        disabled={createSubmitting}
                        onClick={() =>
                          setCreateForm((f) => ({
                            ...f,
                            items: f.items.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-1">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-slate-500">Hàng trả (từ đơn) *</label>
                      {orderLines.length > 0 ? (
                        <select
                          className={fieldSelect}
                          value={it.orderItemId || it.variantIdReturned}
                          onChange={(e) => {
                            const oi = e.target.value;
                            const line = orderLines.find((l) => String(lineOrderItemId(l)) === oi);
                            const vid = line ? lineVariantId(line) : "";
                            const maxQ = maxQtyForOrderItem(oi);
                            setCreateForm((f) => {
                              const next = [...f.items];
                              const q =
                                maxQ != null && maxQ >= 1
                                  ? String(Math.min(maxQ, Number(next[idx].quantity) || 1) || 1)
                                  : next[idx].quantity;
                              next[idx] = {
                                ...next[idx],
                                orderItemId: oi,
                                variantIdReturned: vid != null ? String(vid) : "",
                                quantity: q,
                              };
                              return { ...f, items: next };
                            });
                          }}
                          disabled={createSubmitting}
                        >
                          <option value="">— Chọn dòng đơn —</option>
                          {orderLines.map((line, li) => {
                            const oid = lineOrderItemId(line);
                            return (
                              <option key={li} value={oid != null ? String(oid) : ""}>
                                {lineLabel(line)}
                              </option>
                            );
                          })}
                        </select>
                      ) : null}
                      {(it.orderItemId || it.variantIdReturned) && orderLines.length > 0 ? (() => {
                        const selectedLine = orderLines.find(
                          (l) => String(lineOrderItemId(l)) === String(it.orderItemId || it.variantIdReturned)
                        );
                        if (!selectedLine) return null;
                        return (
                          <div className="mt-2 rounded-md border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                            <ProductLineCell {...extractProductLineFields(selectedLine)} size="sm" />
                          </div>
                        );
                      })() : null}
                      {orderLines.length === 0 ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          className={fieldInput}
                          placeholder="variantId trả"
                          value={it.variantIdReturned}
                          onChange={(e) =>
                            setCreateForm((f) => {
                              const next = [...f.items];
                              next[idx] = { ...next[idx], variantIdReturned: e.target.value };
                              return { ...f, items: next };
                            })
                          }
                          disabled={createSubmitting}
                        />
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500">Số lượng *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={fieldInput}
                          value={it.quantity}
                          onChange={(e) =>
                            setCreateForm((f) => {
                              const next = [...f.items];
                              next[idx] = { ...next[idx], quantity: e.target.value };
                              return { ...f, items: next };
                            })
                          }
                          disabled={createSubmitting}
                        />
                        {(it.orderItemId || it.variantIdReturned) && maxQtyForOrderItem(it.orderItemId || it.variantIdReturned) != null ? (
                          <p className="text-[10px] text-slate-500">Còn được trả: {maxQtyForOrderItem(it.orderItemId || it.variantIdReturned)}</p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500">
                          Đổi sang (biến thể nhận) {normReturnType(createForm.type) === "exchange" ? "*" : ""}
                        </label>
                        {normReturnType(createForm.type) === "exchange" ? (
                          orderLines.length > 0 ? (
                            <div className="space-y-1.5">
                              <select
                                className={fieldSelect}
                                value={exchangeLineIdSet.has(String(it.variantIdExchanged)) ? String(it.variantIdExchanged) : ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setCreateForm((f) => {
                                    const next = [...f.items];
                                    next[idx] = { ...next[idx], variantIdExchanged: v };
                                    return { ...f, items: next };
                                  });
                                }}
                                disabled={createSubmitting}
                              >
                                <option value="">— Chọn từ dòng đơn —</option>
                                {orderLines.map((line, li) => {
                                  const vid = lineVariantId(line);
                                  return (
                                    <option key={li} value={vid != null ? String(vid) : ""}>
                                      {lineLabel(line)}
                                    </option>
                                  );
                                })}
                              </select>
                              <input
                                type="text"
                                inputMode="numeric"
                                className={fieldInput}
                                placeholder="Hoặc nhập ID biến thể nhận (không nằm trên đơn)"
                                value={it.variantIdExchanged}
                                onChange={(e) =>
                                  setCreateForm((f) => {
                                    const next = [...f.items];
                                    next[idx] = { ...next[idx], variantIdExchanged: e.target.value };
                                    return { ...f, items: next };
                                  })
                                }
                                disabled={createSubmitting}
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              inputMode="numeric"
                              className={fieldInput}
                              placeholder="variantId nhận (đổi)"
                              value={it.variantIdExchanged}
                              onChange={(e) =>
                                setCreateForm((f) => {
                                  const next = [...f.items];
                                  next[idx] = { ...next[idx], variantIdExchanged: e.target.value };
                                  return { ...f, items: next };
                                })
                              }
                              disabled={createSubmitting}
                            />
                          )
                        ) : (
                          <input
                            type="text"
                            inputMode="numeric"
                            className={fieldInput}
                            placeholder="Chỉ dùng khi loại Đổi hàng"
                            value={it.variantIdExchanged}
                            disabled
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
