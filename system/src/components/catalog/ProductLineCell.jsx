import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolveMediaUrl";
import { formatProductLineTitle } from "@/lib/productLineFields";

/**
 * @param {{
 *   productName?: unknown
 *   variantName?: unknown
 *   sku?: unknown
 *   imageUrl?: unknown
 *   variantImageUrl?: unknown
 *   variantId?: unknown
 *   size?: "sm" | "md"
 *   className?: string
 *   emptyLabel?: string
 * }} props
 */
export function ProductLineCell({
  productName,
  variantName,
  sku,
  imageUrl,
  variantImageUrl,
  variantId,
  size = "md",
  className,
  emptyLabel = "—",
}) {
  const imgSrc = resolveMediaUrl(variantImageUrl) || resolveMediaUrl(imageUrl);
  const title = formatProductLineTitle({ productName, variantName, sku, variantId });
  const hasContent = title !== "—";
  const showProductSub =
    productName &&
    variantName &&
    String(productName).trim() &&
    String(variantName).trim() &&
    String(productName) !== String(variantName);
  const dim = size === "sm" ? "h-10 w-10" : "h-14 w-14";
  const iconSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  if (!hasContent) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  return (
    <div className={cn("flex min-w-0 items-start gap-3", className)}>
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800",
          dim
        )}
      >
        {imgSrc ? (
          <img src={imgSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Package className={cn(iconSize, "opacity-50")} aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{title}</p>
        {showProductSub ? (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{String(productName)}</p>
        ) : null}
        {sku ? (
          <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-500">{String(sku)}</p>
        ) : null}
      </div>
    </div>
  );
}
