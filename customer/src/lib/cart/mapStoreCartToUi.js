import { STORE_PRODUCT_PLACEHOLDER_IMAGE } from '../catalog/mapStoreProductDetail'

/**
 * @param {unknown} lines — StoreCartLineDto[]
 * @returns {object[]} — props-friendly rows cho CartItemList / CartItem
 */
export function mapStoreCartLinesToUiItems(lines) {
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
      const sku =
        typeof line.sku === 'string' && line.sku.trim() ? line.sku.trim() : ''

      const specs = []
      if (variantName) {
        specs.push({ icon: 'category', text: variantName })
      }
      if (sku) {
        specs.push({ icon: 'sell', text: `SKU: ${sku}` })
      }
      if (line.insufficientStock) {
        specs.push({
          icon: 'warning',
          text: 'Số lượng trong giỏ có thể vượt tồn kho.',
        })
      }

      const img =
        typeof line.imageUrl === 'string' && line.imageUrl.trim()
          ? line.imageUrl.trim()
          : STORE_PRODUCT_PLACEHOLDER_IMAGE

      const unit = line.unitPrice != null ? Number(line.unitPrice) : 0
      const qty = line.quantity != null ? Number(line.quantity) : 0

      return {
        lineId: line.lineId,
        id: line.variantId,
        name: productName,
        image: img,
        imageAlt: productName,
        specs,
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        price: Number.isFinite(unit) && unit >= 0 ? unit : 0,
        originalPrice: undefined,
        discountPercent: undefined,
        insufficientStock: Boolean(line.insufficientStock),
      }
    })
}
