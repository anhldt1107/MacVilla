/** Giống listing khi API chưa có ảnh */
export const STORE_PRODUCT_PLACEHOLDER_IMAGE =
  'https://placehold.co/480x480/f1f5f9/64748b/png?text=S%E1%BA%A3n+ph%E1%BA%A9m'

/**
 * Ảnh trái: gom toàn bộ `imageUrl` của các biến thể (bỏ trùng URL).
 * @param {object} detail — StoreProductDetailDto (camelCase)
 * @returns {{ mainImage: string, mainImageAlt: string, thumbnails: { src: string, alt: string }[], moreThumbsCount: number }}
 */
export function buildGalleryFromDetail(detail) {
  const name = typeof detail?.name === 'string' ? detail.name : 'Sản phẩm'
  const urls = []
  const seen = new Set()
  for (const v of detail?.variants ?? []) {
    const u = typeof v?.imageUrl === 'string' ? v.imageUrl.trim() : ''
    if (u && !seen.has(u)) {
      seen.add(u)
      urls.push(u)
    }
  }
  const mainImage = urls[0] ?? STORE_PRODUCT_PLACEHOLDER_IMAGE
  const rest = urls.slice(1)
  const thumbnails = rest.map((src, i) => ({
    src,
    alt: `${name} — ảnh ${i + 2}`,
  }))
  const moreThumbsCount = Math.max(0, rest.length - 3)
  return {
    mainImage,
    mainImageAlt: name,
    thumbnails,
    moreThumbsCount,
  }
}

/**
 * @param {object} detail
 * @param {object | null} selectedVariant
 * @returns {{ label: string, value: string }[]}
 */
export function buildTechnicalSpecsFromDetail(detail, selectedVariant) {
  const rows = []
  if (detail?.categoryName) {
    rows.push({ label: 'Danh mục', value: String(detail.categoryName) })
  }
  const w = detail?.warrantyPeriodMonths
  if (typeof w === 'number' && w > 0) {
    rows.push({ label: 'Bảo hành', value: `${w} tháng` })
  }
  for (const a of detail?.attributes ?? []) {
    const name = typeof a?.name === 'string' ? a.name : ''
    const vals = (Array.isArray(a?.values) ? a.values : [])
      .map((x) => (x && typeof x.value === 'string' ? x.value : ''))
      .filter(Boolean)
      .join(', ')
    if (name && vals) rows.push({ label: name, value: vals })
  }
  if (selectedVariant && typeof selectedVariant === 'object') {
    if (selectedVariant.sku) {
      rows.push({ label: 'SKU', value: String(selectedVariant.sku) })
    }
    if (selectedVariant.dimensions) {
      rows.push({
        label: 'Kích thước',
        value: String(selectedVariant.dimensions),
      })
    }
    if (selectedVariant.weight != null && selectedVariant.weight !== '') {
      rows.push({
        label: 'Trọng lượng',
        value: `${selectedVariant.weight} kg`,
      })
    }
  }
  return rows
}

/**
 * @param {object} detail
 * @returns {{ icon: string, title: string, subtitle: string }[]}
 */
export function buildHighlightsFromDetail(detail) {
  const out = []
  const w = detail?.warrantyPeriodMonths
  if (typeof w === 'number' && w > 0) {
    out.push({
      icon: 'verified_user',
      title: `Bảo hành ${w} tháng`,
      subtitle: 'Theo chính sách cửa hàng',
    })
  }
  const cat = detail?.categoryName
  if (cat) {
    out.push({
      icon: 'category',
      title: String(cat),
      subtitle: 'Danh mục sản phẩm',
    })
  }
  return out.slice(0, 4)
}

/**
 * @param {object} detail
 * @param {object | null} variant
 */
export function resolveDetailPricing(detail, variant) {
  const baseRaw = detail?.basePrice
  const base = baseRaw != null ? Number(baseRaw) : null
  const retailRaw = variant != null ? variant.retailPrice : null
  let price =
    retailRaw != null && retailRaw !== '' ? Number(retailRaw) : null
  if (price == null || Number.isNaN(price)) {
    price = base != null && !Number.isNaN(base) ? base : null
  }
  if (price != null && Number.isNaN(price)) price = null

  let originalPrice
  let discountPercent
  if (
    base != null &&
    !Number.isNaN(base) &&
    price != null &&
    !Number.isNaN(price) &&
    base > price
  ) {
    originalPrice = base
    discountPercent = Math.round((1 - price / base) * 100)
  }
  return { price, originalPrice, discountPercent }
}

/**
 * @param {object | null} variant
 */
export function variantLooksInStock(variant) {
  if (variant == null) return true
  const q = variant.quantityAvailable
  if (q == null) return true
  return Number(q) > 0
}

/**
 * Chuẩn hoá biến thể để hiển thị danh sách mô tả trên trang chi tiết.
 * @param {object} detail — StoreProductDetailDto
 * @returns {{ id: number, variantName: string, sku: string, retailPrice: number | null, quantityAvailable: number | null | undefined, dimensions?: string, weight?: number | string | null, imageUrl?: string, inStock: boolean }[]}
 */
export function mapVariantsForUi(detail) {
  const list = Array.isArray(detail?.variants) ? detail.variants : []
  const baseFallback =
    detail?.basePrice != null ? Number(detail.basePrice) : null
  const baseOk =
    baseFallback != null && !Number.isNaN(baseFallback) ? baseFallback : null

  return list
    .filter((v) => v && typeof v.id === 'number')
    .map((v) => {
      const retailRaw = v.retailPrice
      const retail =
        retailRaw != null && retailRaw !== ''
          ? Number(retailRaw)
          : null
      const price =
        retail != null && !Number.isNaN(retail)
          ? retail
          : baseOk
      const qa = v.quantityAvailable
      const inStock = qa == null || Number(qa) > 0
      const name =
        typeof v.variantName === 'string' && v.variantName.trim()
          ? v.variantName.trim()
          : `Biến thể #${v.id}`

      return {
        id: v.id,
        variantName: name,
        sku: typeof v.sku === 'string' ? v.sku.trim() : '',
        retailPrice: price != null && !Number.isNaN(price) ? price : null,
        quantityAvailable: qa,
        dimensions:
          typeof v.dimensions === 'string' && v.dimensions.trim()
            ? v.dimensions.trim()
            : undefined,
        weight: v.weight,
        imageUrl:
          typeof v.imageUrl === 'string' && v.imageUrl.trim()
            ? v.imageUrl.trim()
            : undefined,
        inStock,
      }
    })
}
