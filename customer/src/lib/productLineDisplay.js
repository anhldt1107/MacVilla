/** @param {Record<string, unknown> | null | undefined} obj */
export function pickField(obj, camel, pascal) {
  if (!obj || typeof obj !== 'object') return undefined
  if (obj[camel] != null && obj[camel] !== '') return obj[camel]
  if (obj[pascal] != null && obj[pascal] !== '') return obj[pascal]
  return undefined
}

/** @param {Record<string, unknown> | null | undefined} row */
export function extractProductLineFields(row) {
  const o = row && typeof row === 'object' ? row : {}
  return {
    productName: pickField(o, 'productName', 'ProductName') ?? pickField(o, 'name', 'Name'),
    variantName: pickField(o, 'variantName', 'VariantName'),
    sku:
      pickField(o, 'sku', 'Sku') ??
      pickField(o, 'skuSnapshot', 'SkuSnapshot') ??
      pickField(o, 'currentSku', 'CurrentSku'),
    imageUrl: pickField(o, 'imageUrl', 'ImageUrl') ?? pickField(o, 'productImageUrl', 'ProductImageUrl'),
    variantImageUrl: pickField(o, 'variantImageUrl', 'VariantImageUrl'),
    variantId: pickField(o, 'variantId', 'VariantId'),
  }
}

/** @param {Record<string, unknown> | null | undefined} row @param {'returned'|'exchanged'} side */
export function extractReturnSideFields(row, side) {
  const suffix = side === 'exchanged' ? 'Exchanged' : 'Returned'
  const o = row && typeof row === 'object' ? row : {}
  return {
    productName: pickField(o, `productName${suffix}`, `ProductName${suffix}`),
    variantName: pickField(o, `variantName${suffix}`, `VariantName${suffix}`),
    sku: pickField(o, `sku${suffix}`, `Sku${suffix}`),
    imageUrl: pickField(o, `imageUrl${suffix}`, `ImageUrl${suffix}`),
    variantId: pickField(o, `variantId${suffix}`, `VariantId${suffix}`),
  }
}

/** @param {{ productName?: unknown, variantName?: unknown, sku?: unknown, variantId?: unknown }} fields */
export function formatProductLineTitle(fields) {
  const primary = fields.variantName || fields.productName
  if (primary) return String(primary)
  if (fields.sku) return String(fields.sku)
  if (fields.variantId != null) return `Biến thể #${fields.variantId}`
  return '—'
}
