import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminCustomers, fetchAdminCustomerDetail } from "@/services/admin/adminCustomersApi";
import { createAdminOrder } from "@/services/admin/adminOrdersApi";
import { AdminVariantSearchPicker } from "@/components/Admin/inventory/AdminVariantSearchPicker";
import { StoreVariantLinePicker } from "@/components/Saler/StoreVariantLinePicker";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAYMENT_OPTIONS = [
  { value: "Cash", label: "Tiền mặt" },
  { value: "BankTransfer", label: "Chuyển khoản" },
  { value: "PayOS", label: "PayOS" },
];

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

function newLineRow() {
  return {
    key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `l-${Date.now()}-${Math.random()}`,
    variantId: null,
    variantLabel: "",
    vSearch: "",
    quantity: "1",
    adminVariantId: "",
  };
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Tạo đơn hàng — POST /api/admin/orders (Sales tạo hộ khách).
 */
export function AdminOrderCreatePage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();
  const useStoreCatalog = paths.shell === "saler";

  const [customerId, setCustomerId] = useState("");
  const [custQ, setCustQ] = useState("");
  const custDeb = useDebounced(custQ, 400);
  const [custHits, setCustHits] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [custLabel, setCustLabel] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [shippingAddressId, setShippingAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [voucherCode, setVoucherCode] = useState("");
  const [note, setNote] = useState("");

  const [lines, setLines] = useState(() => [newLineRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !custDeb.trim()) {
      setCustHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCustLoading(true);
      try {
        const r = await fetchAdminCustomers(accessToken, { page: 1, pageSize: 12, search: custDeb.trim() });
        if (!cancelled) setCustHits(r.items ?? []);
      } catch {
        if (!cancelled) setCustHits([]);
      } finally {
        if (!cancelled) setCustLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, custDeb, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !customerId) {
      setAddresses([]);
      setShippingAddressId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const detail = await fetchAdminCustomerDetail(accessToken, customerId);
        const addrs = detail?.addresses ?? detail?.Addresses ?? [];
        if (!cancelled) {
          setAddresses(Array.isArray(addrs) ? addrs : []);
          const first = addrs[0];
          const fid = pickRow(first, "id", "Id");
          setShippingAddressId(fid != null ? String(fid) : "");
        }
      } catch {
        if (!cancelled) {
          setAddresses([]);
          setShippingAddressId("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, customerId, isAuthenticated]);

  const applyCustomer = (row) => {
    const id = pickRow(row, "id", "Id");
    const fn = pickRow(row, "fullName", "FullName");
    const phone = pickRow(row, "phone", "Phone");
    if (id == null || !Number.isFinite(Number(id))) return;
    setCustomerId(String(Number(id)));
    const bits = [fn != null ? String(fn) : null, phone != null ? String(phone) : null].filter(Boolean);
    setCustLabel(bits.join(" · ") || `Khách #${id}`);
    setCustQ("");
    setCustHits([]);
  };

  const updateLine = useCallback((key, patch) => {
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const addLine = () => setLines((rows) => [...rows, newLineRow()]);
  const removeLine = (key) => setLines((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));

  const submit = async () => {
    if (!accessToken) return;
    setError("");
    const cid = Number(customerId);
    const aid = Number(shippingAddressId);
    if (!Number.isFinite(cid) || cid <= 0) {
      setError("Chọn khách hàng.");
      return;
    }
    if (!Number.isFinite(aid) || aid <= 0) {
      setError("Chọn địa chỉ giao hàng.");
      return;
    }
    const parsedLines = [];
    for (const line of lines) {
      const vid = useStoreCatalog ? line.variantId : Number(line.adminVariantId);
      const qty = Number(line.quantity);
      if (vid == null || !Number.isFinite(vid) || vid <= 0) {
        setError("Mỗi dòng cần chọn biến thể.");
        return;
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        setError("Số lượng phải lớn hơn 0.");
        return;
      }
      parsedLines.push({ variantId: vid, quantity: qty });
    }
    setSubmitting(true);
    try {
      const created = await createAdminOrder(accessToken, {
        customerId: cid,
        shippingAddressId: aid,
        paymentMethod,
        voucherCode: voucherCode.trim() || undefined,
        note: note.trim() || undefined,
        lines: parsedLines,
      });
      const newId = pickRow(created, "id", "Id");
      if (newId != null) {
        navigate(`${paths.ordersList}/${encodeURIComponent(String(newId))}`, { replace: true });
      } else {
        setError("Tạo thành công nhưng không nhận được mã đơn — kiểm tra danh sách.");
      }
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tạo đơn thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to={paths.root} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link to={paths.ordersList} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Đơn hàng
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="truncate px-1.5 font-semibold text-slate-800 dark:text-slate-200">Tạo đơn</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Tạo đơn hộ khách</h1>
        {useStoreCatalog ? (
          <p className="mt-1 text-sm text-muted-foreground">Tra SKU qua catalog cửa hàng khi chọn dòng hàng.</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Khách & giao hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customerId ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-700">
              <span className="text-sm font-medium">{custLabel}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setCustomerId(""); setCustLabel(""); }}>
                Đổi khách
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="search"
                className={fieldInput}
                placeholder="Tìm khách theo tên, SĐT…"
                value={custQ}
                onChange={(e) => setCustQ(e.target.value)}
                disabled={!isAuthenticated}
              />
              {custLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
              {custHits.length > 0 ? (
                <ul className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                  {custHits.map((row, i) => (
                    <li key={pickRow(row, "id", "Id") ?? i}>
                      <button type="button" className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => applyCustomer(row)}>
                        {pickRow(row, "fullName", "FullName") ?? "—"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
          {addresses.length > 0 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="ship-addr">
                Địa chỉ giao *
              </label>
              <select
                id="ship-addr"
                className={fieldSelect}
                value={shippingAddressId}
                onChange={(e) => setShippingAddressId(e.target.value)}
              >
                {addresses.map((a) => {
                  const id = pickRow(a, "id", "Id");
                  const line = pickRow(a, "addressLine", "AddressLine");
                  const city = pickRow(a, "city", "City");
                  return (
                    <option key={id} value={String(id)}>
                      {[line, city].filter(Boolean).join(", ") || `Địa chỉ #${id}`}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : customerId ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">Khách chưa có địa chỉ — thêm địa chỉ trong hồ sơ khách trước.</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="pay-method">
                Thanh toán *
              </label>
              <select id="pay-method" className={fieldSelect} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="voucher">
                Mã voucher
              </label>
              <input id="voucher" className={fieldInput} value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="order-note">
              Ghi chú
            </label>
            <textarea id="order-note" className={cn(fieldInput, "min-h-[72px] py-2")} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Dòng hàng</CardTitle>
            <CardDescription>Ít nhất một biến thể.</CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Thêm dòng
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line, idx) => (
            <div key={line.key} className="rounded-xl border border-slate-200/90 p-4 dark:border-slate-700">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Dòng {idx + 1}</span>
                {lines.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => removeLine(line.key)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
              {useStoreCatalog ? (
                <StoreVariantLinePicker
                  line={line}
                  disabled={!isAuthenticated}
                  onChange={(patch) => updateLine(line.key, patch)}
                />
              ) : (
                <AdminVariantSearchPicker
                  accessToken={accessToken}
                  value={line.adminVariantId}
                  onChange={(v) => updateLine(line.key, { adminVariantId: v })}
                  idPrefix={`order-line-${line.key}`}
                  label="Biến thể"
                  requiredMark
                />
              )}
              <div className="mt-3 space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Số lượng *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={fieldInput}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={submitting || !isAuthenticated} onClick={() => void submit()}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Tạo đơn
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to={paths.ordersList}>Hủy</Link>
        </Button>
      </div>
    </div>
  );
}
