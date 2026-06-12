import {
  formatContractDate,
  formatContractValidityRange,
  fromDateInputValue,
} from "@/lib/contractValidity";
import { cn } from "@/lib/utils";
import { CalendarRange } from "lucide-react";

/**
 * Một khu vực duy nhất cho thời hạn hiệu lực trên trang chi tiết hợp đồng.
 * - Chỉnh sửa: ô ngày (không lặp summary ở header)
 * - Chỉ đọc: hiển thị khoảng ngày (không dùng input disabled)
 *
 * @param {{
 *   validFrom: string;
 *   validTo: string;
 *   editable: boolean;
 *   onValidFromChange?: (value: string) => void;
 *   onValidToChange?: (value: string) => void;
 *   fieldClassName?: string;
 *   sendHint?: string | null;
 *   requireBeforeSend?: boolean;
 *   idPrefix?: string;
 *   className?: string;
 * }} props
 */
export function ContractValiditySection({
  validFrom,
  validTo,
  editable,
  onValidFromChange,
  onValidToChange,
  fieldClassName,
  sendHint,
  requireBeforeSend = false,
  idPrefix = "contract",
  className,
}) {
  const range = formatContractValidityRange(
    fromDateInputValue(validFrom),
    fromDateInputValue(validTo, { endOfDay: true })
  );

  if (!editable) {
    return (
      <section
        className={cn(
          "rounded-lg border border-slate-200/90 bg-slate-50/60 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/35",
          className
        )}
        aria-label="Thời hạn hiệu lực"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300">
            <CalendarRange className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Thời hạn hiệu lực
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {range ?? "Chưa đặt thời hạn"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("space-y-3", className)} aria-label="Thời hạn hiệu lực">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thời hạn hiệu lực</h3>
        {requireBeforeSend ? (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Bắt buộc nhập đủ ngày từ và đến trước khi gửi khách xác nhận.
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor={`${idPrefix}-valid-from`}>
            Từ ngày
          </label>
          <input
            id={`${idPrefix}-valid-from`}
            type="date"
            className={fieldClassName}
            value={validFrom}
            onChange={(e) => onValidFromChange?.(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor={`${idPrefix}-valid-to`}>
            Đến ngày
          </label>
          <input
            id={`${idPrefix}-valid-to`}
            type="date"
            className={fieldClassName}
            value={validTo}
            onChange={(e) => onValidToChange?.(e.target.value)}
          />
        </div>
      </div>
      {range ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Xem trước:{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatContractDate(fromDateInputValue(validFrom))} →{" "}
            {formatContractDate(fromDateInputValue(validTo, { endOfDay: true }))}
          </span>
        </p>
      ) : null}
      {sendHint ? (
        <p className="text-sm text-amber-700 dark:text-amber-400" role="status">
          {sendHint}
        </p>
      ) : null}
    </section>
  );
}
