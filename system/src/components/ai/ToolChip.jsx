import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLatency, formatToolLabel } from "@/services/ai/toolLabels";

/**
 * Chip nhỏ hiển thị tool đã được Gemini gọi ( §10.3).
 * @param {{ toolName: string; latencyMs?: number; success?: boolean; className?: string }} props
 */
export function ToolChip({ toolName, latencyMs, success, className }) {
  const label = formatToolLabel(toolName);
  const latency = formatLatency(latencyMs);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
        success === false && "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
        className
      )}
      title={toolName}
    >
      <Sparkles className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      <span className="whitespace-nowrap">Đã xem: {label}</span>
      {latency ? <span className="opacity-70">{latency}</span> : null}
    </span>
  );
}
