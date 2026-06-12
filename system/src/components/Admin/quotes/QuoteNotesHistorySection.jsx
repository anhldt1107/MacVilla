import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    return String(iso);
  }
}

function pickText(quote, camel, pascal) {
  const v = quote?.[camel] ?? quote?.[pascal];
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

/**
 * Ghi chú nội bộ + phản hồi khách B2B (yêu cầu, thương lượng, từ chối) và mốc duyệt.
 *
 * @param {{
 *   quote: Record<string, unknown> | null | undefined;
 *   hideInternalNotes?: boolean;
 *   className?: string;
 * }} props
 */
export function QuoteNotesHistorySection({ quote, hideInternalNotes = false, className }) {
  if (!quote) return null;

  const internalNotes = pickText(quote, "notes", "Notes");
  const customerNotes = pickText(quote, "customerNotes", "CustomerNotes");
  const counterOfferMessage = pickText(quote, "counterOfferMessage", "CounterOfferMessage");
  const customerRejectReason = pickText(quote, "customerRejectReason", "CustomerRejectReason");
  const rejectReason = pickText(quote, "rejectReason", "RejectReason");
  const status = String(quote.status ?? quote.Status ?? "");

  const approvedAt = quote.approvedAt ?? quote.ApprovedAt;
  const rejectedAt = quote.rejectedAt ?? quote.RejectedAt;
  const customerAcceptedAt = quote.customerAcceptedAt ?? quote.CustomerAcceptedAt;
  const customerRejectedAt = quote.customerRejectedAt ?? quote.CustomerRejectedAt;

  const showInternal = !hideInternalNotes && internalNotes;
  const hasContent =
    showInternal ||
    customerNotes ||
    counterOfferMessage ||
    customerRejectReason ||
    rejectReason ||
    approvedAt ||
    rejectedAt ||
    customerAcceptedAt ||
    customerRejectedAt;

  if (!hasContent) return null;

  return (
    <Card className={cn("border-slate-200/80 dark:border-slate-800", className)}>
      <CardHeader>
        <CardTitle className="text-base">Ghi chú và lịch sử</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {showInternal ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ghi chú nội bộ (Sales)
            </p>
            <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{internalNotes}</p>
          </div>
        ) : null}

        {customerNotes ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ghi chú từ khách (khi yêu cầu báo giá)
            </p>
            <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{customerNotes}</p>
          </div>
        ) : null}

        {counterOfferMessage ? (
          <div
            className={cn(
              "rounded-lg border px-3 py-3",
              status === "CounterOffer"
                ? "border-orange-200/90 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/25"
                : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40"
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                status === "CounterOffer" ? "text-orange-800 dark:text-orange-200" : "text-slate-500 dark:text-slate-400"
              )}
            >
              Phản hồi thương lượng của khách
            </p>
            <p
              className={cn(
                "mt-1 whitespace-pre-wrap",
                status === "CounterOffer" ? "text-orange-950 dark:text-orange-100" : "text-slate-800 dark:text-slate-200"
              )}
            >
              {counterOfferMessage}
            </p>
          </div>
        ) : null}

        {customerRejectReason ? (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-xs font-semibold uppercase text-amber-900 dark:text-amber-200">Khách từ chối báo giá</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950 dark:text-amber-100">{customerRejectReason}</p>
            {customerRejectedAt ? (
              <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">{formatDateTime(customerRejectedAt)}</p>
            ) : null}
          </div>
        ) : null}

        {rejectReason ? (
          <div className="rounded-lg border border-red-200/80 bg-red-50/50 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20">
            <p className="text-xs font-semibold uppercase text-red-800 dark:text-red-200">Manager từ chối</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-red-900 dark:text-red-100">{rejectReason}</p>
          </div>
        ) : null}

        <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
          {approvedAt ? (
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-200">Manager duyệt:</span>{" "}
              {formatDateTime(approvedAt)}
            </p>
          ) : null}
          {rejectedAt ? (
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-200">Manager từ chối (lúc):</span>{" "}
              {formatDateTime(rejectedAt)}
            </p>
          ) : null}
          {customerAcceptedAt ? (
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-200">Khách chấp nhận:</span>{" "}
              {formatDateTime(customerAcceptedAt)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
