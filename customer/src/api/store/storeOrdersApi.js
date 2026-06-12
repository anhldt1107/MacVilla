import { apiJson } from '../httpClient'

/**
 * @param {{
 *   shippingAddressId: number,
 *   voucherCode: string | null,
 *   paymentMethod: string,
 * }} body
 */
function storeOrderCheckoutPayload(body) {
  const code = body.voucherCode
  const voucherCode =
    code == null || String(code).trim() === '' ? null : String(code).trim()
  return {
    shippingAddressId: body.shippingAddressId,
    voucherCode,
    paymentMethod: String(body.paymentMethod ?? '').trim() || 'PayOS',
  }
}

/**
 * POST /api/store/orders/preview
 *
 * Body: { shippingAddressId, voucherCode: string | null, paymentMethod }
 * Envelope data: { lines, merchandiseSubtotal, discountAmount, payableTotal, voucherId, voucherCode }
 *
 * @param {string} token
 * @param {{
 *   shippingAddressId: number,
 *   voucherCode: string | null,
 *   paymentMethod: string,
 * }} body
 */
export function storePreviewOrder(token, body) {
  return apiJson('/api/store/orders/preview', {
    method: 'POST',
    token,
    json: storeOrderCheckoutPayload(body),
  }).then((r) => r.data)
}

/**
 * POST /api/store/orders — cùng body với preview.
 *
 * @param {string} token
 * @param {{
 *   shippingAddressId: number,
 *   voucherCode: string | null,
 *   paymentMethod: string,
 * }} body
 */
export function storeCreateOrder(token, body) {
  return apiJson('/api/store/orders', {
    method: 'POST',
    token,
    json: storeOrderCheckoutPayload(body),
  }).then((r) => r.data)
}
