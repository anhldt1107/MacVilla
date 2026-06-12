import { storeCreatePayOsPaymentLink } from '../../api/store/storePaymentsApi'
import { persistCheckoutOrderForReturn } from './checkoutReturnSession'

/** @param {unknown} pm */
export function isPayOsPaymentMethod(pm) {
  return String(pm ?? '')
    .trim()
    .toLowerCase() === 'payos'
}

/**
 * Đơn PayOS còn chờ thanh toán — có thể gọi lại API tạo/mở link.
 * @param {unknown} order
 */
export function canResumePayOsPayment(order) {
  if (!order || typeof order !== 'object') return false
  const o = /** @type {Record<string, unknown>} */ (order)
  const pm = o.paymentMethod ?? o.PaymentMethod
  const ps = o.paymentStatus ?? o.PaymentStatus
  const os = o.orderStatus ?? o.OrderStatus
  if (!isPayOsPaymentMethod(pm)) return false
  if (String(os ?? '').toLowerCase() === 'cancelled') return false
  const pay = String(ps ?? '').trim().toLowerCase()
  return pay === 'unpaid'
}

export function buildPayOsCheckoutUrls() {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    returnUrl: `${origin}/checkout/success`,
    cancelUrl: `${origin}/checkout/cancel`,
  }
}

/**
 * Tạo hoặc lấy lại link PayOS (BE idempotent) rồi chuyển trình duyệt.
 * @param {string} accessToken
 * @param {string} orderCode
 * @param {string} [paymentMethod]
 */
export async function resumePayOsCheckout(accessToken, orderCode, paymentMethod = 'PayOS') {
  const code = String(orderCode ?? '').trim()
  if (!code) throw new Error('Thiếu mã đơn hàng.')
  const { returnUrl, cancelUrl } = buildPayOsCheckoutUrls()
  persistCheckoutOrderForReturn(code, paymentMethod)
  const data = await storeCreatePayOsPaymentLink(accessToken, {
    orderCode: code,
    returnUrl,
    cancelUrl,
  })
  const url =
    data && typeof data.checkoutUrl === 'string' ? data.checkoutUrl.trim() : ''
  if (!url) {
    throw new Error('Không nhận được liên kết thanh toán từ máy chủ.')
  }
  window.location.assign(url)
}
