import { useState } from "react";
import { createAdminWarrantyTicketClaim } from "@/services/admin/adminWarrantyApi";
import { ApiRequestError } from "@/services/api/apiEnvelope";
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
import { ProductLineCell } from "@/components/catalog/ProductLineCell";
import { formatWarrantyLineLabel, getWarrantyTicketLines, warrantyLineCanCreateClaim } from "./warrantyTicketLineUtils";
import { Loader2, Plus } from "lucide-react";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(String(iso)).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(iso);
  }
}

function emptyClaimForm() {
  return {
    orderItemId: "",
    variantId: "",
    defectDescription: "",
    imagesUrl: "",
    estimatedCost: "0",
    note: "",
  };
}

/**
 * @param {{
 *   detail: Record<string, unknown> | null;
 *   ticketId: string;
 *   accessToken: string | null;
 *   onClaimCreated?: () => void;
 * }} props
 */
export function WarrantyTicketLinesCard({ detail, ticketId, accessToken, onClaimCreated }) {
  const lines = getWarrantyTicketLines(detail);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimForm, setClaimForm] = useState(emptyClaimForm);

  const openClaimForLine = (line) => {
    setClaimForm({
      ...emptyClaimForm(),
      orderItemId: String(line.orderItemId),
      variantId: String(line.variantId),
    });
    setClaimError("");
    setClaimOpen(true);
  };

  const submitClaim = async () => {
    if (!accessToken || !ticketId || claimSubmitting) return;
    const oi = Number(claimForm.orderItemId);
    const vid = Number(claimForm.variantId);
    if (!Number.isFinite(oi) || oi < 1) {
      setClaimError("Chọn dòng sản phẩm được bảo hành.");
      return;
    }
    if (!Number.isFinite(vid) || vid < 1) {
      setClaimError("Thiếu biến thể cho dòng đơn.");
      return;
    }
    const est = Number(String(claimForm.estimatedCost).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(est) || est < 0) {
      setClaimError("Chi phí dự kiến phải là số ≥ 0.");
      return;
    }
    setClaimSubmitting(true);
    setClaimError("");
    try {
      const body = { orderItemId: oi, variantId: vid, estimatedCost: est };
      const dd = claimForm.defectDescription.trim();
      if (dd) body.defectDescription = dd;
      const img = claimForm.imagesUrl.trim();
      if (img) body.imagesUrl = img;
      const note = claimForm.note.trim();
      if (note) body.note = note;

      await createAdminWarrantyTicketClaim(accessToken, ticketId, body);
      setClaimOpen(false);
      setClaimForm(emptyClaimForm());
      onClaimCreated?.();
    } catch (e) {
      setClaimError(
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Tạo yêu cầu thất bại."
      );
    } finally {
      setClaimSubmitting(false);
    }
  };

  const eligibleLines = lines.filter((l) => warrantyLineCanCreateClaim(l));

  return (
    <>
      <Card className="border-slate-200/80 dark:border-slate-800 lg:col-span-2">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Sản phẩm được bảo hành</CardTitle>
          </div>
          {eligibleLines.length > 0 ? (
            <Button type="button" size="sm" className="gap-1.5 shrink-0" onClick={() => openClaimForLine(eligibleLines[0])}>
              <Plus className="h-4 w-4" aria-hidden />
              Tạo claim
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {lines.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">Chưa có phạm vi theo dòng đơn.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                    <th className="px-4 py-2 pl-6">Sản phẩm</th>
                    <th className="px-4 py-2">SL</th>
                    <th className="px-4 py-2">Thời hạn</th>
                    <th className="px-4 py-2">Hết hạn</th>
                    <th className="px-4 py-2 pr-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lines.map((line) => (
                    <tr key={String(line.orderItemId)}>
                      <td className="px-4 py-2.5 pl-6">
                        <ProductLineCell
                          productName={line.productName}
                          variantName={line.variantName}
                          sku={line.sku}
                          imageUrl={line.imageUrl}
                          variantImageUrl={line.variantImageUrl}
                          variantId={line.variantId}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{line.quantity}</td>
                      <td className="px-4 py-2.5">{line.warrantyPeriodMonths} tháng</td>
                      <td className="px-4 py-2.5">
                        <span>{formatDate(line.validUntil)}</span>
                        {line.isValid ? (
                          <span className="ml-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200">
                            Còn hạn
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300">
                            Hết hạn
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 pr-6 text-right">
                        {warrantyLineCanCreateClaim(line) ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => openClaimForLine(line)}>
                            Tạo claim
                          </Button>
                        ) : line.activeClaimId != null ? (
                          <span className="text-xs text-amber-700 dark:text-amber-300">
                            Đang xử lý #{line.activeClaimId}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={claimOpen}
        onOpenChange={(open) => {
          setClaimOpen(open);
          if (!open) {
            setClaimError("");
            setClaimForm(emptyClaimForm());
          }
        }}
      >
        <DialogContent
          className="max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-lg min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-lg"
          onPointerDownOutside={(e) => claimSubmitting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu bảo hành (claim)</DialogTitle>
            <DialogDescription>Chọn dòng sản phẩm còn trong thời hạn bảo hành.</DialogDescription>
          </DialogHeader>
          <div className="grid min-w-0 gap-3">
            <div className="min-w-0 space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-500" id="cl-line-label">
                Dòng đơn <span className="text-red-600">*</span>
              </span>
              <div
                className="max-h-44 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 divide-y divide-slate-100 dark:border-slate-700 dark:divide-slate-800"
                role="listbox"
                aria-labelledby="cl-line-label"
              >
                {eligibleLines.map((line) => {
                  const label = formatWarrantyLineLabel(line);
                  const selected = String(line.orderItemId) === claimForm.orderItemId;
                  return (
                    <button
                      key={line.orderItemId}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      title={label}
                      disabled={claimSubmitting}
                      className={cn(
                        "block w-full min-w-0 max-w-full truncate px-3 py-2.5 text-left text-sm transition-colors",
                        selected
                          ? "bg-violet-50 font-medium text-violet-900 dark:bg-violet-950/50 dark:text-violet-100"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900/80"
                      )}
                      onClick={() =>
                        setClaimForm((f) => ({
                          ...f,
                          orderItemId: String(line.orderItemId),
                          variantId: String(line.variantId),
                        }))
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {!claimForm.orderItemId ? (
                <p className="text-xs text-slate-500">Chọn một dòng sản phẩm ở trên.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="cl-d">
                Mô tả lỗi
              </label>
              <textarea
                id="cl-d"
                rows={3}
                className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
                value={claimForm.defectDescription}
                onChange={(e) => setClaimForm((f) => ({ ...f, defectDescription: e.target.value }))}
                disabled={claimSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="cl-cost">
                Chi phí dự kiến (đ)
              </label>
              <input
                id="cl-cost"
                type="text"
                inputMode="decimal"
                className={fieldInput}
                value={claimForm.estimatedCost}
                onChange={(e) => setClaimForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                disabled={claimSubmitting}
              />
            </div>
          </div>
          {claimError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {claimError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={claimSubmitting} onClick={() => setClaimOpen(false)}>
              Hủy
            </Button>
            <Button type="button" disabled={claimSubmitting} onClick={() => void submitClaim()}>
              {claimSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
