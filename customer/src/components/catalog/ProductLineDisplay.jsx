import { StoreLineImageThumbnail } from './StoreLineImageThumbnail'
import { formatProductLineTitle } from '../../lib/productLineDisplay'

/**
 * @param {{
 *   productName?: unknown
 *   variantName?: unknown
 *   sku?: unknown
 *   imageUrl?: unknown
 *   variantImageUrl?: unknown
 *   variantId?: unknown
 *   className?: string
 * }} props
 */
export function ProductLineDisplay({
  productName,
  variantName,
  sku,
  imageUrl,
  variantImageUrl,
  variantId,
  className = '',
}) {
  const title = formatProductLineTitle({ productName, variantName, sku, variantId })
  const showProductSub =
    productName &&
    variantName &&
    String(productName).trim() &&
    String(variantName).trim() &&
    String(productName) !== String(variantName)

  return (
    <div className={`flex min-w-0 items-start gap-3 ${className}`.trim()}>
      <StoreLineImageThumbnail
        variantImageUrl={typeof variantImageUrl === 'string' ? variantImageUrl : undefined}
        productImageUrl={typeof imageUrl === 'string' ? imageUrl : undefined}
        alt={title}
      />
      <div className="min-w-0 flex-1">
        <span className="font-medium text-slate-900 dark:text-slate-100">{title}</span>
        {showProductSub ? (
          <span className="block text-xs text-slate-500 mt-0.5">{String(productName)}</span>
        ) : null}
        {sku ? (
          <span className="block font-mono text-xs text-slate-500 mt-0.5">{String(sku)}</span>
        ) : null}
      </div>
    </div>
  )
}
