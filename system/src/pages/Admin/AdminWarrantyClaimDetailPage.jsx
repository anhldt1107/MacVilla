import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStaffShellPaths } from "@/hooks/useStaffShellPaths";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import {
  WARRANTY_CLAIM_STATUS_FLOW,
  fetchAdminWarrantyClaimDetail,
  fetchAdminWarrantyStatuses,
  getAllowedWarrantyClaimNextStatuses,
  isWarrantyClaimTerminalStatus,
  labelAdminWarrantyClaimStatus,
  updateAdminWarrantyClaimStatus,
} from "@/services/admin/adminWarrantyApi";
import { Check, ChevronRight, Loader2, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint } from "@/components/ui/FieldHint";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProductLineCell } from "@/components/catalog/ProductLineCell";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

function norm(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
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

export function AdminWarrantyClaimDetailPage() {
  const { claimId: claimIdParam } = useParams();
  const paths = useStaffShellPaths();
  const warrantyList = paths.warrantyTicketsList;
  const { accessToken, isAuthenticated } = useAuth();
  const claimId = String(claimIdParam ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [claimStatusOptions, setClaimStatusOptions] = useState([]);

  const [nextStatus, setNextStatus] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const { claimStatuses } = await fetchAdminWarrantyStatuses(accessToken);
        if (!cancelled) setClaimStatusOptions(claimStatuses.filter((o) => o.value));
      } catch {
        if (!cancelled) setClaimStatusOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthenticated]);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !claimId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const d = await fetchAdminWarrantyClaimDetail(accessToken, claimId);
      const rec = d && typeof d === "object" ? /** @type {Record<string, unknown>} */ (d) : null;
      setDetail(rec);
      if (rec) {
        setNextStatus("");
        const ec = pick(rec, "estimatedCost", "EstimatedCost");
        setEstimatedCost(ec != null && ec !== "" ? String(ec) : "");
        setResolution(String(pick(rec, "resolution", "Resolution") ?? ""));
        setNote(String(pick(rec, "note", "Note") ?? ""));
      }
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được claim.";
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, claimId]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentStatus = detail ? String(pick(detail, "status", "Status") ?? "") : "";

  const claimTerminal = isWarrantyClaimTerminalStatus(currentStatus);
  const branchEnd = (() => {
    const k = norm(currentStatus);
    return k === "rejected" || k === "cancelled" || k === "canceled";
  })();

  const allowedNextStatuses = useMemo(() => getAllowedWarrantyClaimNextStatuses(currentStatus), [currentStatus]);
  const nextStatusOptions = useMemo(
    () =>
      allowedNextStatuses.map((value) => ({
        value,
        label: labelAdminWarrantyClaimStatus(value, claimStatusOptions),
      })),
    [allowedNextStatuses, claimStatusOptions]
  );

  const flowIdx = WARRANTY_CLAIM_STATUS_FLOW.findIndex((s) => norm(s) === norm(currentStatus));

  const ticketId = detail ? pick(detail, "warrantyTicketId", "WarrantyTicketId") ?? pick(detail, "ticketId", "TicketId") : null;
  const ticketNum = detail ? pick(detail, "ticketNumber", "TicketNumber") : null;
  const variantId = detail ? pick(detail, "variantId", "VariantId") : null;
  const orderItemId = detail ? pick(detail, "orderItemId", "OrderItemId") : null;
  const sku = detail ? pick(detail, "sku", "Sku") : null;
  const productName = detail ? pick(detail, "productName", "ProductName") : null;
  const variantName = detail ? pick(detail, "variantName", "VariantName") : null;
  const imageUrl = detail ? pick(detail, "imageUrl", "ImageUrl") : null;
  const lineValidUntil = detail ? pick(detail, "lineValidUntil", "LineValidUntil") : null;
  const defect = detail ? pick(detail, "defectDescription", "DefectDescription") : null;
  const created = detail ? pick(detail, "createdAt", "CreatedAt") : null;
  const custName = detail ? pick(detail, "customerName", "CustomerName") : null;

  const submitStatus = async () => {
    if (!accessToken || !claimId || saveSubmitting) return;
    if (claimTerminal) {
      setSaveError("Yêu cầu đã kết thúc — không thể chuyển trạng thái.");
      return;
    }
    const st = nextStatus.trim();
    if (!st) {
      setSaveError("Chọn bước trạng thái tiếp theo.");
      return;
    }
    const allowed = getAllowedWarrantyClaimNextStatuses(currentStatus);
    if (!allowed.some((a) => norm(a) === norm(st))) {
      setSaveError("Không thể chuyển sang trạng thái này từ bước hiện tại.");
      return;
    }
    setSaveSubmitting(true);
    setSaveError("");
    try {
      /** @type {Record<string, unknown>} */
      const body = { status: st };
      const ec = estimatedCost.trim();
      if (ec !== "") {
        const n = Number(ec.replace(/\s/g, "").replace(",", "."));
        if (Number.isFinite(n) && n >= 0) body.estimatedCost = n;
      }
      const res = resolution.trim();
      if (res) body.resolution = res;
      const nt = note.trim();
      if (nt) body.note = nt;

      await updateAdminWarrantyClaimStatus(accessToken, claimId, body);
      setNextStatus("");
      await load();
    } catch (e) {
      setSaveError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Cập nhật thất bại.");
    } finally {
      setSaveSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10 print:max-w-none">
      <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500 print:hidden dark:text-slate-400" aria-label="Breadcrumb">
        <Link to={paths.root} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <Link to={warrantyList} className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          Bảo hành
        </Link>
        {ticketId != null ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
            <Link
              to={`${warrantyList}/${encodeURIComponent(String(ticketId))}`}
              className="rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {ticketNum != null ? String(ticketNum) : `Phiếu #${ticketId}`}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        <span className="px-1.5 font-semibold text-slate-800 dark:text-slate-200">Claim #{claimId}</span>
      </nav>

      {loading && !detail ? (
        <div className="flex justify-center py-20 print:hidden">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600/70" aria-hidden />
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          <header className="border-b border-slate-200 pb-6 print:border-0 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Yêu cầu bảo hành #{claimId}</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Trạng thái hiện tại:{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {labelAdminWarrantyClaimStatus(currentStatus, claimStatusOptions)}
                  </span>
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden />
                In biên nhận
              </Button>
            </div>
          </header>

          <Card className="border-slate-200/80 print:hidden print:border-0 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base">Tiến trình xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              {branchEnd ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
                  Yêu cầu đã kết thúc:{" "}
                  <strong>{labelAdminWarrantyClaimStatus(currentStatus, claimStatusOptions)}</strong>.
                </p>
              ) : (
                <ol className="space-y-3">
                  {WARRANTY_CLAIM_STATUS_FLOW.map((step, i) => {
                    const done = flowIdx >= 0 && i < flowIdx;
                    const current = flowIdx === i;
                    const label = labelAdminWarrantyClaimStatus(step, claimStatusOptions);
                    return (
                      <li key={step} className="flex gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            done && "bg-emerald-500 text-white",
                            current && "bg-violet-600 text-white ring-2 ring-violet-300 dark:ring-violet-800",
                            !done && !current && "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          )}
                        >
                          {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                        </span>
                        <div>
                          <p className={cn("text-sm font-medium", current && "text-violet-800 dark:text-violet-200")}>{label}</p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{step}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
            <Card className="border-slate-200/80 print:shadow-none dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Chi tiết yêu cầu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ProductLineCell
                  productName={productName}
                  variantName={variantName}
                  sku={sku}
                  imageUrl={imageUrl}
                  variantId={variantId}
                />
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-slate-500">Dòng đơn</span>
                  <span className="font-mono">{orderItemId != null ? String(orderItemId) : "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Hạn BH dòng</span>
                  <span>{formatDateTime(lineValidUntil != null ? String(lineValidUntil) : "")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Khách</span>
                  <span>{custName != null ? String(custName) : "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Tạo lúc</span>
                  <span>{formatDateTime(created != null ? String(created) : "")}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="text-slate-500">Mô tả lỗi</span>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{defect != null ? String(defect) : "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 print:hidden dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Cập nhật trạng thái</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {claimTerminal ? null : (
                  <>
                    {allowedNextStatuses.length === 0 ? (
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Không xác định được bước tiếp theo. Liên hệ quản trị.
                      </p>
                    ) : null}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="claim-next-st">
                        Chuyển sang <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="claim-next-st"
                        className={fieldInput}
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value)}
                        disabled={saveSubmitting || nextStatusOptions.length === 0}
                      >
                        <option value="">— Chọn bước tiếp theo —</option>
                        {nextStatusOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {nextStatusOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {nextStatusOptions.map((o) => (
                          <Button
                            key={o.value}
                            type="button"
                            size="sm"
                            variant={norm(nextStatus) === norm(o.value) ? "default" : "outline"}
                            disabled={saveSubmitting}
                            onClick={() => setNextStatus(o.value)}
                          >
                            {o.label}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="cs-cost">
                    Chi phí dự kiến (đ)
                  </label>
                  <input
                    id="cs-cost"
                    type="text"
                    inputMode="decimal"
                    className={fieldInput}
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    disabled={saveSubmitting || claimTerminal}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-xs font-semibold uppercase text-slate-500" htmlFor="cs-res">
                    Kết quả xử lý
                    <FieldHint text="Nên điền khi chuyển sang Hoàn thành hoặc Từ chối." />
                  </label>
                  <textarea
                    id="cs-res"
                    rows={3}
                    className={cn(fieldInput, "min-h-[88px] resize-y py-2")}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    disabled={saveSubmitting || claimTerminal}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="cs-note">
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    id="cs-note"
                    rows={2}
                    className={cn(fieldInput, "min-h-[72px] resize-y py-2")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={saveSubmitting || claimTerminal}
                  />
                </div>
                {saveError ? (
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <Button type="button" className="gap-1.5" disabled={saveSubmitting || claimTerminal} onClick={() => void submitStatus()}>
                  {saveSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                  Lưu trạng thái
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 print:block print:border-slate-400 dark:border-slate-600 dark:bg-slate-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg font-semibold uppercase tracking-wide">Biên nhận bàn giao</CardTitle>
              <CardDescription className="text-center text-xs">In từ hệ thống — không có giá trị pháp lý thay thế chứng từ gốc</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Mã yêu cầu:</span>{" "}
                <span className="font-mono font-semibold">#{claimId}</span>
              </p>
              {ticketNum != null || ticketId != null ? (
                <p>
                  <span className="text-slate-500">Phiếu BH:</span>{" "}
                  <span className="font-mono font-semibold">{ticketNum != null ? String(ticketNum) : `#${ticketId}`}</span>
                </p>
              ) : null}
              <p>
                <span className="text-slate-500">Trạng thái:</span> {labelAdminWarrantyClaimStatus(currentStatus, claimStatusOptions)}
              </p>
              <p>
                <span className="text-slate-500">Thời gian in:</span> {formatDateTime(new Date().toISOString())}
              </p>
              <p>
                <span className="text-slate-500">Chi phí dự kiến:</span> {formatMoneyVnd(pick(detail, "estimatedCost", "EstimatedCost"))}
              </p>
              {(() => {
                const resDoc = detail ? String(pick(detail, "resolution", "Resolution") ?? "").trim() : "";
                const show = resDoc || resolution.trim();
                return show ? (
                  <p>
                    <span className="text-slate-500">Kết quả:</span> {resDoc || resolution.trim()}
                  </p>
                ) : null;
              })()}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
