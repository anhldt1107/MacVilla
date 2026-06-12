import { cn } from "@/lib/utils";

/**
 * @param {object} p
 * @param {string} p.label
 * @param {string} p.value
 * @param {string} [p.hint]
 * @param {string} [p.className]
 */
export function KpiMini({ label, value, hint, className }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card px-3 py-2.5 shadow-sm",
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
