import { STORE_PRODUCT_PLACEHOLDER_IMAGE } from './mapStoreProductDetail'

/**
 * @param {object} item — StoreProductListItemDto (camelCase từ API; có `imageUrl` từ GET /api/store/products)
 */
export function mapStoreProductToListingCard(item) {
  const base = item.basePrice != null ? Number(item.basePrice) : null
  const warranty = item.warrantyPeriodMonths ?? 0
  const badges =
    warranty > 0
      ? [`Bảo hành ${warranty} tháng`]
      : ['Bảo hành chính hãng']

  const imageUrl =
    typeof item.imageUrl === 'string' && item.imageUrl.trim()
      ? item.imageUrl.trim()
      : ''

  return {
    id: item.id,
    name: item.name,
    tag: item.categoryName || 'Sản phẩm',
    image: imageUrl || STORE_PRODUCT_PLACEHOLDER_IMAGE,
    imageAlt: item.name,
    price: base != null && !Number.isNaN(base) ? base : 0,
    originalPrice: undefined,
    badges,
    slug: item.slug,
  }
}
