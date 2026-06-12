import { useState, useEffect, useMemo } from 'react'
import { STORE_PRODUCT_PLACEHOLDER_IMAGE } from '../../lib/catalog/mapStoreProductDetail'
import { resolveStoreMediaUrl } from '../../lib/catalog/resolveStoreMediaUrl'

/**
 * Ảnh dòng hàng: biến thể → sản phẩm → placeholder (xử lý onError lần lượt).
 * @param {{ variantImageUrl?: string | null, productImageUrl?: string | null, alt?: string, className?: string }} props
 */
export function StoreLineImageThumbnail({
  variantImageUrl,
  productImageUrl,
  alt = '',
  className = 'w-14 h-14 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 object-contain',
}) {
  const v = resolveStoreMediaUrl(variantImageUrl)
  const p = resolveStoreMediaUrl(productImageUrl)
  const chain = useMemo(() => {
    const out = []
    const seen = new Set()
    for (const u of [v, p, STORE_PRODUCT_PLACEHOLDER_IMAGE]) {
      if (!u || seen.has(u)) continue
      seen.add(u)
      out.push(u)
    }
    return out.length > 0 ? out : [STORE_PRODUCT_PLACEHOLDER_IMAGE]
  }, [v, p])

  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [v, p])

  const safeIdx = Math.min(idx, chain.length - 1)
  const src = chain[safeIdx] ?? STORE_PRODUCT_PLACEHOLDER_IMAGE

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        if (safeIdx >= chain.length - 1) {
          e.currentTarget.onerror = null
          return
        }
        setIdx((i) => i + 1)
      }}
    />
  )
}
