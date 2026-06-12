import { apiJson } from '../httpClient'

/**
 * GET /api/store/me/cart — giỏ hiện tại (B2C, cần Bearer).
 * @param {string} token
 * @returns {Promise<object>} StoreCartDto (camelCase)
 */
export function storeFetchCart(token) {
  return apiJson('/api/store/me/cart', {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/me/cart/vouchers — gợi ý mã theo giỏ (B2C, JWT).
 * @param {string} token
 * @returns {Promise<{ merchandiseSubtotal?: number, items?: unknown[] }>}
 */
export function storeFetchCartVouchers(token) {
  return apiJson('/api/store/me/cart/vouchers', {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * PUT /api/store/me/cart/items/{variantId} — đặt số lượng (0 = xóa dòng).
 * @param {string} token
 * @param {number} variantId
 * @param {number} quantity
 * @returns {Promise<object>} StoreCartDto
 */
export function storeSetCartLineQuantity(token, variantId, quantity) {
  const q = Number(quantity)
  const bodyQty =
    Number.isFinite(q) && q >= 0 ? Math.floor(q) : 0
  return apiJson(
    `/api/store/me/cart/items/${encodeURIComponent(String(variantId))}`,
    {
      method: 'PUT',
      token,
      json: { quantity: bodyQty },
    }
  ).then((r) => r.data)
}

/**
 * DELETE /api/store/me/cart/items/{variantId} — xóa một dòng.
 * @param {string} token
 * @param {number} variantId
 * @returns {Promise<object>} StoreCartDto
 */
export function storeRemoveCartLine(token, variantId) {
  return apiJson(
    `/api/store/me/cart/items/${encodeURIComponent(String(variantId))}`,
    {
      method: 'DELETE',
      token,
    }
  ).then((r) => r.data)
}

/**
 * DELETE /api/store/me/cart — làm rỗng giỏ.
 * @param {string} token
 */
export function storeClearCart(token) {
  return apiJson('/api/store/me/cart', {
    method: 'DELETE',
    token,
  })
}

/**
 * POST /api/store/me/cart/items — thêm / cập nhật dòng giỏ (B2C, cần Bearer).
 * @param {string} token
 * @param {{ variantId: number, quantity?: number }} body — quantity mặc định 1
 * @returns {Promise<{ message: string, data: object }>}
 */
export function storeAddCartItem(token, body) {
  const qRaw = body.quantity != null ? Number(body.quantity) : 1
  const quantity =
    Number.isFinite(qRaw) && qRaw > 0 ? Math.floor(qRaw) : 1
  return apiJson('/api/store/me/cart/items', {
    method: 'POST',
    token,
    json: {
      variantId: body.variantId,
      quantity,
    },
  }).then((r) => ({
    message:
      typeof r.message === 'string' && r.message.trim()
        ? r.message.trim()
        : 'Đã cập nhật giỏ hàng',
    data: r.data,
  }))
}
