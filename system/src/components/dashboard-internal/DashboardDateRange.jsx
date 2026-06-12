import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { defaultDateRange30d } from "./dashboardFormat";

/**
 * Bộ lọc khoảng ngày (YYYY-MM-DD) + tuỳ chọn granularity.
 * @param {object} p
 * @param {string} p.fromDate
 * @param {string} p.toDate
 * @param {(v: string) => void} p.onFromChange
 * @param {(v: string) => void} p.onToChange
 * @param {boolean} [p.showGranularity]
 * @param {string} [p.granularity] day | week | month
 * @param {(v: string) => void} [p.onGranularityChange]
 * @param {string} [p.className]
 */
export function DashboardDateRange({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  showGranularity = false,
  granularity = "day",
  onGranularityChange,
  className,
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="db-from">
          Từ ngày
        </label>
        <input
          id="db-from"
          type="date"
          className={cn(
            "h-9 rounded-md border border-input bg-background px-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="db-to">
          Đến ngày
        </label>
        <input
          id="db-to"
          type="date"
          className={cn(
            "h-9 rounded-md border border-input bg-background px-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
      {showGranularity && onGranularityChange ? (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Chu kỳ</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value)}
          >
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => {
          const d = defaultDateRange30d();
          onFromChange(d.fromDate);
          onToChange(d.toDate);
        }}
      >
        30 ngày
      </Button>
    </div>
  );
}
