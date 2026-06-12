import { useEffect, useState } from "react";
import { fetchStoreVariantBySku, pickStoreRow } from "@/services/store/storeCatalogApi";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Chọn biến thể qua SKU (store API — Sales không dùng admin variants).
 * @param {{
 *   line: { variantId: number | null; variantLabel: string; vSearch: string; unitPrice: string };
 *   disabled?: boolean;
 *   onChange: (patch: Partial<{ variantId: number | null; variantLabel: string; vSearch: string; unitPrice: string }>) => void;
 * }} props
 */
export function StoreVariantLinePicker({ line, disabled, onChange }) {
  const skuDeb = useDebounced(line.vSearch, 500);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (line.variantId != null || !skuDeb.trim() || skuDeb.trim().length < 2) {
      setErr("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const row = await fetchStoreVariantBySku(skuDeb.trim());
        if (cancelled) return;
        const vid = pickStoreRow(row, "id", "Id");
        if (vid == null || !Number.isFinite(Number(vid))) {
          setErr("Không tìm thấy SKU.");
          return;
        }
        const sku = pickStoreRow(row, "sku", "Sku");
        const pn = pickStoreRow(row, "productName", "ProductName");
        const vn = pickStoreRow(row, "variantName", "VariantName");
        const rp = pickStoreRow(row, "retailPrice", "RetailPrice");
        const avail = pickStoreRow(row, "quantityAvailable", "QuantityAvailable");
        const label = [pn, vn, sku != null ? `SKU ${sku}` : null].filter(Boolean).join(" · ");
        const stockHint = avail != null ? ` · Tồn: ${avail}` : "";
        onChange({
          variantId: Number(vid),
          variantLabel: `${label || `Biến thể #${vid}`}${stockHint}`,
          vSearch: "",
          unitPrice: rp != null && Number.isFinite(Number(rp)) ? String(rp) : "",
        });
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Tra SKU thất bại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange stable enough from parent
  }, [skuDeb, line.variantId]);

  if (line.variantId != null) {
    return (
      <div className="mb-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/25">
        <p className="font-medium text-slate-900 dark:text-slate-100">{line.variantLabel}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">Mã biến thể: {line.variantId}</p>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs"
          onClick={() => onChange({ variantId: null, variantLabel: "", vSearch: "" })}
          disabled={disabled}
        >
          Chọn biến thể khác
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-3 space-y-2">
      <input
        type="search"
        className={fieldInput}
        placeholder="Nhập SKU chính xác (Enter hoặc dừng gõ 0.5s)…"
        value={line.vSearch}
        onChange={(e) => onChange({ vSearch: e.target.value })}
        disabled={disabled}
      />
      <p className="text-[11px] text-muted-foreground">Tra cứu catalog cửa hàng — không hiển thị giá vốn.</p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Đang tra SKU…
        </div>
      ) : null}
      {err ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
