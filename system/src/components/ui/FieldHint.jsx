import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Gợi ý ngắn — không chiếm layout; hover/focus xem đầy đủ.
 * @param {{ text: string, className?: string }} props
 */
export function FieldHint({ text, className }) {
  if (!text?.trim()) return null;
  return (
    <span
      className={cn("inline-flex align-middle text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", className)}
      title={text}
      aria-label={text}
      role="img"
    >
      <HelpCircle className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
