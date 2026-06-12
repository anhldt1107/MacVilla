import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminCustomers } from "@/services/admin/adminCustomersApi";
import { fetchAdminVariants } from "@/services/admin/adminVariantsApi";
import { StoreVariantLinePicker } from "@/components/Saler/StoreVariantLinePicker";
import {
  ADMIN_QUOTE_DISCOUNT_TYPE_OPTIONS,
  createAdminQuote,
} from "@/services/admin/adminQuotesApi";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    unitPrice: "",
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

function datetimeLocalToIso(local) {
  const t = String(local || "").trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Tạo báo giá B2B — POST /api/admin/quotes.
 */
export function AdminQuoteCreatePage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const paths = useStaffShellPaths();

  const [customerId, setCustomerId] = useState("");
  const [custQ, setCustQ] = useState("");
  const custDeb = useDebounced(custQ, 400);
  const [custHits, setCustHits] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [custLabel, setCustLabel] = useState("");

  const [lines, setLines] = useState(() => [newLineRow()]);
  const [discountType, setDiscountType] = useState("Percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

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

  const clearCustomer = () => {
    setCustomerId("");
    setCustLabel("");
  };

  const updateLine = useCallback((key, patch) => {
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const addLine = () => setLines((rows) => [...rows, newLineRow()]);
  const removeLine = (key) => {
    setLines((rows) => {
      if (rows.length <= 1) return rows;
      return rows.filter((r) => r.key !== key);
    });
  };

  const submit = async () => {
    if (!accessToken || submitting) return;
    setError("");
    const cid = Number(String(customerId).trim());
    if (!Number.isFinite(cid) || cid < 1) {
      setError("Chọn khách hàng (tìm và chọn một dòng trong danh sách).");
      return;
    }
    const linesPayload = [];
    for (let i = 0; i < lines.length; i++) {
      const row = lines[i];
      if (row.variantId == null || !Number.isFinite(Number(row.variantId))) {
        setError(`Dòng ${i + 1}: chọn biến thể (SKU).`);
        return;
      }
      const qty = Number(String(row.quantity).trim());
      if (!Number.isFinite(qty) || qty < 1) {
        setError(`Dòng ${i + 1}: số lượng phải ≥ 1.`);
        return;
      }
      const upRaw = String(row.unitPrice).trim().replace(/\s/g, "").replace(",", ".");
      /** @type {{ variantId: number; quantity: number; unitPrice?: number }} */
      const item = { variantId: Number(row.variantId), quantity: qty };
      if (upRaw !== "") {
        const up = Number(upRaw);
        if (!Number.isFinite(up) || up < 0) {
          setError(`Dòng ${i + 1}: đơn giá không hợp lệ (để trống nếu dùng giá bán lẻ hệ thống).`);
          return;
        }
        item.unitPrice = up;
      }
      linesPayload.push(item);
    }
    let discType = null;
    let discVal = null;
    const dvRaw = discountValue.trim();
    if (dvRaw !== "") {
      const dv = Number(dvRaw.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(dv) || dv < 0) {
        setError("Giá trị chiết khấu không hợp lệ.");
        return;
      }
      discVal = dv;
      discType = discountType || "Percentage";
    }
    setSubmitting(true);
    try {
      const created = await createAdminQuote(accessToken, {
        customerId: cid,
        lines: linesPayload,
        discountType: discType,
        discountValue: discVal,
        validUntil: datetimeLocalToIso(validUntil),
        notes: notes.trim() === "" ? null : notes.trim(),
      });
      const raw = created && typeof created === "object" ? /** @type {Record<string, unknown>} */ (created) : {};
      const newId = raw.id ?? raw.Id;
      if (newId != null) {
        navigate(`${paths.quotesList}/${encodeURIComponent(String(newId))}`, { replace: true });
      } else {
        setError("Tạo thành công nhưng không nhận được mã báo giá — kiểm tra danh sách.");
      }
    } catch (e) {
      setError(
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tạo báo giá thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const createPath = `${paths.quotesList}/create`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link
          to={paths.root}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="px-1.5 py-0.5 text-slate-400 dark:text-slate-500">Bán hàng</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={paths.quotesList}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Báo giá (B2B)
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="truncate px-1.5 font-semibold text-slate-800 dark:text-slate-200">Tạo mới</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Tạo báo giá B2B</h1>

      </div>

      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Khách hàng</CardTitle>
          <CardDescription>Chọn khách hàng cho báo giá.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {customerId && /^\d+$/.test(customerId) ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{custLabel || "Đã chọn"}</p>
                <p className="text-xs text-slate-500">Mã khách: {customerId}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={clearCustomer}>
                Đổi khách
              </Button>
            </div>
          ) : (
            <>
              <input
                type="search"
                className={fieldInput}
                placeholder="Tên, SĐT, email…"
                value={custQ}
                onChange={(e) => setCustQ(e.target.value)}
                disabled={!isAuthenticated}
              />
              {custLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Đang tìm…
                </div>
              ) : null}
              {custHits.length > 0 ? (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                  {custHits.map((row, idx) => {
                    const id = pickRow(row, "id", "Id");
                    const fn = pickRow(row, "fullName", "FullName");
                    const phone = pickRow(row, "phone", "Phone");
                    return (
                      <li key={id != null ? String(id) : idx}>
                        <button
                          type="button"
                          className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                          onClick={() => applyCustomer(row)}
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
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Dòng hàng</CardTitle>
            <CardDescription>Mỗi dòng: biến thể (SKU), số lượng; để trống đơn giá sẽ dùng giá bán lẻ.</CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={addLine}>
            <Plus className="h-4 w-4" aria-hidden />
            Thêm dòng
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line, idx) => (
            <QuoteLineFields
              key={line.key}
              index={idx}
              line={line}
              accessToken={accessToken}
              isAuthenticated={isAuthenticated}
              onChange={(patch) => updateLine(line.key, patch)}
              onRemove={() => removeLine(line.key)}
              canRemove={lines.length > 1}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Chiết khấu & hiệu lực</CardTitle>
          <CardDescription>Tuỳ chọn — khớp cập nhật báo giá Draft (Percentage / FixedAmount).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="qc-disc-type">
              Loại chiết khấu
            </label>
            <div className="relative">
              <select
                id="qc-disc-type"
                className={fieldSelect}
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                {ADMIN_QUOTE_DISCOUNT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="qc-disc-val">
              Giá trị (để trống = không chiết khấu)
            </label>
            <input
              id="qc-disc-val"
              type="text"
              inputMode="decimal"
              className={fieldInput}
              placeholder="VD. 5 cho 5%"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="qc-valid">
              Hiệu lực đến
            </label>
            <input
              id="qc-valid"
              type="datetime-local"
              className={fieldInput}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="qc-notes">
              Ghi chú
            </label>
            <textarea
              id="qc-notes"
              rows={3}
              className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
              placeholder="Ghi chú nội bộ / gửi kèm báo giá…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" className="gap-1.5" disabled={submitting || !isAuthenticated} onClick={() => void submit()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          Tạo báo giá
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to={paths.quotesList} aria-disabled={submitting} className={submitting ? "pointer-events-none opacity-50" : undefined}>
            Hủy
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   index: number;
 *   line: { key: string; variantId: number | null; variantLabel: string; vSearch: string; quantity: string; unitPrice: string };
 *   accessToken: string | null;
 *   isAuthenticated: boolean;
 *   useStoreCatalog?: boolean;
 *   onChange: (patch: Partial<{ variantId: number | null; variantLabel: string; vSearch: string; quantity: string; unitPrice: string }>) => void;
 *   onRemove: () => void;
 *   canRemove: boolean;
 * }} props
 */
function QuoteLineFields({ index, line, accessToken, isAuthenticated, useStoreCatalog, onChange, onRemove, canRemove }) {
  const vDeb = useDebounced(line.vSearch, 400);
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !vDeb.trim() || line.variantId != null) {
      setHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetchAdminVariants(accessToken, { page: 1, pageSize: 20, search: vDeb.trim() });
        if (!cancelled) setHits(r.items ?? []);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated, vDeb, line.variantId]);

  const pickVariant = (row) => {
    const vid = pickRow(row, "id", "Id");
    const sku = pickRow(row, "sku", "Sku");
    const pn = pickRow(row, "productName", "ProductName");
    const vn = pickRow(row, "variantName", "VariantName");
    if (vid == null || !Number.isFinite(Number(vid))) return;
    const label = [pn, vn, sku != null ? `SKU ${sku}` : null].filter(Boolean).join(" · ");
    const rp = pickRow(row, "retailPrice", "RetailPrice");
    onChange({
      variantId: Number(vid),
      variantLabel: label || `Biến thể #${vid}`,
      vSearch: "",
      unitPrice: rp != null && Number.isFinite(Number(rp)) ? String(rp) : "",
    });
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 dark:border-slate-700 dark:bg-slate-900/30">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Dòng {index + 1}</span>
        {canRemove ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-red-600 dark:text-red-400" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Xóa
          </Button>
        ) : null}
      </div>
      {useStoreCatalog ? (
        <StoreVariantLinePicker line={line} disabled={!isAuthenticated} onChange={onChange} />
      ) : line.variantId != null ? (
        <div className="mb-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/25">
          <p className="font-medium text-slate-900 dark:text-slate-100">{line.variantLabel}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Mã biến thể: {line.variantId}</p>
          <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => onChange({ variantId: null, variantLabel: "", vSearch: "" })}>
            Chọn biến thể khác
          </Button>
        </div>
      ) : (
        <div className="mb-3 space-y-2">
          <input
            type="search"
            className={fieldInput}
            placeholder="Tìm SKU, tên sản phẩm, biến thể…"
            value={line.vSearch}
            onChange={(e) => onChange({ vSearch: e.target.value })}
            disabled={!isAuthenticated}
          />
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Đang tìm biến thể…
            </div>
          ) : null}
          {hits.length > 0 ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
              {hits.map((row, i) => {
                const vid = pickRow(row, "id", "Id");
                const sku = pickRow(row, "sku", "Sku");
                const pn = pickRow(row, "productName", "ProductName");
                return (
                  <li key={vid != null ? String(vid) : i}>
                    <button
                      type="button"
                      className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900"
                      onClick={() => pickVariant(row)}
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">{pn != null ? String(pn) : `ID ${vid}`}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {sku != null ? <span className="font-mono">{String(sku)}</span> : null}
                        {vid != null ? <span className="text-slate-500"> · #{vid}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : vDeb.trim() && !loading && line.variantId == null ? (
            <p className="text-xs text-slate-500">Không thấy biến thể.</p>
          ) : null}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-slate-500">Số lượng *</label>
          <input
            type="text"
            inputMode="numeric"
            className={fieldInput}
            value={line.quantity}
            onChange={(e) => onChange({ quantity: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-slate-500">Đơn giá (tuỳ chọn)</label>
          <input
            type="text"
            inputMode="decimal"
            className={fieldInput}
            placeholder="Để trống = giá bán lẻ"
            value={line.unitPrice}
            onChange={(e) => onChange({ unitPrice: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
