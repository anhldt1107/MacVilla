import { useEffect, useState } from "react";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { updateAdminVariantInventoryReorderPolicy } from "@/services/admin/adminProductsApi";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

/**
 * Form PUT `/inventory/reorder-policy` — tách khỏi cập nhật số lượng tồn ( N1).
 * @param {{
 *   accessToken: string | null;
 *   productId: string;
 *   variantId: string;
 *   enabled: boolean;
 *   reorderPoint: number | null | undefined;
 *   safetyStock: number | null | undefined;
 *   onSaved?: (data: unknown) => void;
 * }} props
 */
export function VariantInventoryReorderPolicy({ accessToken, productId, variantId, enabled, reorderPoint, safetyStock, onSaved }) {
  const [rp, setRp] = useState("");
  const [ss, setSs] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRp(reorderPoint != null && Number.isFinite(Number(reorderPoint)) ? String(reorderPoint) : "");
    setSs(safetyStock != null && Number.isFinite(Number(safetyStock)) ? String(safetyStock) : "");
    setErr("");
  }, [reorderPoint, safetyStock, enabled, productId, variantId]);

  const submit = async () => {
    if (!accessToken || !enabled || loading) return;
    const rpTrim = rp.trim();
    const ssTrim = ss.trim();
    if (rpTrim === "" && ssTrim === "") {
      setLoading(true);
      setErr("");
      try {
        const data = await updateAdminVariantInventoryReorderPolicy(accessToken, productId, variantId, {
          reorderPoint: null,
          safetyStock: null,
        });
        onSaved?.(data);
      } catch (e) {
        setErr(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không lưu được.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (rpTrim === "" && ssTrim !== "") {
      setErr("Có SafetyStock thì phải nhập ReorderPoint.");
      return;
    }
    const rpNum = Number(rpTrim.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(rpNum) || rpNum < 0 || !Number.isInteger(rpNum)) {
      setErr("ReorderPoint phải là số nguyên ≥ 0.");
      return;
    }
    let safetyPayload = null;
    if (ssTrim !== "") {
      const ssNum = Number(ssTrim.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(ssNum) || ssNum < 0 || !Number.isInteger(ssNum)) {
        setErr("SafetyStock phải là số nguyên ≥ 0.");
        return;
      }
      if (ssNum > rpNum) {
        setErr("SafetyStock không được lớn hơn ReorderPoint.");
        return;
      }
      safetyPayload = ssNum;
    }
    setLoading(true);
    setErr("");
    try {
      const data = await updateAdminVariantInventoryReorderPolicy(accessToken, productId, variantId, {
        reorderPoint: rpNum,
        safetyStock: safetyPayload,
      });
      onSaved?.(data);
    } catch (e) {
      setErr(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không lưu được.");
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <p className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        Cập nhật số lượng tồn kho trước khi cấu hình ngưỡng đặt hàng lại.
      </p>
    );
  }

  return (
    <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ngưỡng đặt lại</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500" htmlFor="inv-policy-rp">
            Điểm đặt hàng lại
          </label>
          <input
            id="inv-policy-rp"
            type="number"
            min={0}
            step={1}
            className={fieldInput}
            value={rp}
            onChange={(e) => setRp(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500" htmlFor="inv-policy-ss">
            Tồn an toàn
          </label>
          <input
            id="inv-policy-ss"
            type="number"
            min={0}
            step={1}
            className={fieldInput}
            placeholder="Tuỳ chọn"
            value={ss}
            onChange={(e) => setSs(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      {err ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {err}
        </p>
      ) : null}
      <Button type="button" size="sm" variant="secondary" className="gap-1.5" disabled={loading} onClick={() => void submit()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Lưu ngưỡng
      </Button>
    </div>
  );
}
