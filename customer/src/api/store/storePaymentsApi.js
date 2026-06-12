import { apiJson } from '../httpClient'

/**
 * POST /api/store/payments/payos/create
 *
 * @param {string} token
 * @param {{
 *   orderCode: string,
 *   returnUrl: string,
 *   cancelUrl: string,
 * }} body
 * @returns {Promise<{
 *   orderCode: string,
 *   payOsOrderCode?: number,
 *   amount?: number,
 *   checkoutUrl: string,
 *   paymentLinkId?: string,
 *   linkExpiresAtUtc?: string,
 * }>}
 */
export function storeCreatePayOsPaymentLink(token, body) {
  return apiJson('/api/store/payments/payos/create', {
    method: 'POST',
    token,
    json: {
      orderCode: String(body.orderCode ?? '').trim(),
      returnUrl: String(body.returnUrl ?? '').trim(),
      cancelUrl: String(body.cancelUrl ?? '').trim(),
    },
  }).then((r) => r.data)
}
