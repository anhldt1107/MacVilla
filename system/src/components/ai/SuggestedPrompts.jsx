import { cn } from "@/lib/utils";

/**
 * Prompts gợi ý theo role —  §11.
 */
const PROMPTS = {
  admin: [
    "Tuần này có gì bất thường?",
    "Top 5 khách nợ nhiều nhất",
    "SKU nào sắp hết hàng?",
    "So sánh doanh thu tuần này với tuần trước",
  ],
  manager: [
    "Tuần này có gì bất thường?",
    "Top 5 khách nợ nhiều nhất",
    "SKU nào sắp hết hàng?",
    "So sánh doanh thu tuần này với tuần trước",
  ],
  sales: [
    "Báo giá nào của tôi sắp hết hạn?",
    "Tôi đang ở bước nào trong pipeline?",
    "Đơn DEMO-O-B2B-05 đang ở đâu?",
    "Doanh thu tôi đóng góp tháng này",
  ],
};

/**
 * @param {{ role: keyof typeof PROMPTS; onPick: (text: string) => void; disabled?: boolean }} props
 */
export function SuggestedPrompts({ role, onPick, disabled }) {
  const items = PROMPTS[role] || PROMPTS.manager;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Bạn có thể bắt đầu bằng
      </p>
      <div className="flex flex-col gap-2">
        {items.map((text) => (
          <button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onPick(text)}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition-colors",
              "hover:border-primary/40 hover:bg-primary/5 hover:text-slate-900",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
