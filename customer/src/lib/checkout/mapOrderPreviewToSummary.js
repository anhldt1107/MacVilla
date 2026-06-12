import { STORE_PRODUCT_PLACEHOLDER_IMAGE } from '../catalog/mapStoreProductDetail'

/**
 * @param {unknown} lines
 * @returns {Array<{ id: number, name: string, image: string, imageAlt: string, quantity: number, price: number }>}
 */
export function mapOrderPreviewLinesToSummaryItems(lines) {
  if (!Array.isArray(lines)) return []
  return lines
    .filter((line) => line && typeof line.variantId === 'number')
    .map((line) => {
      const productName =
        typeof line.productName === 'string' && line.productName.trim()
          ? line.productName.trim()
          : 'Sản phẩm'
      const variantName =
        typeof line.variantName === 'string' && line.variantName.trim()
          ? line.variantName.trim()
          : ''
      const name = variantName
        ? `${productName} — ${variantName}`
        : productName

      const img =
        typeof line.imageUrl === 'string' && line.imageUrl.trim()
          ? line.imageUrl.trim()
          : STORE_PRODUCT_PLACEHOLDER_IMAGE

      const unit = line.unitPrice != null ? Number(line.unitPrice) : 0
      const qty = line.quantity != null ? Number(line.quantity) : 0

      return {
        id: line.variantId,
        name,
        image: img,
        imageAlt: productName,
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        price: Number.isFinite(unit) && unit >= 0 ? unit : 0,
      }
    })
}
