const ORDER_CODE_KEY = 'store_checkout_order_code'
const PAYMENT_METHOD_KEY = 'store_checkout_payment_method'

/**
 * Lưu mã đơn trước khi redirect PayOS (returnUrl không giữ React state).
 * @param {string} orderCode
 * @param {string} [paymentMethod]
 */
export function persistCheckoutOrderForReturn(orderCode, paymentMethod) {
  try {
    if (orderCode) sessionStorage.setItem(ORDER_CODE_KEY, orderCode)
    if (paymentMethod)
      sessionStorage.setItem(PAYMENT_METHOD_KEY, paymentMethod)
  } catch {
    /* ignore */
  }
}

/**
 * @returns {{ orderCode: string, paymentMethod: string }}
 */
export function readCheckoutOrderFromSession() {
  try {
    return {
      orderCode: sessionStorage.getItem(ORDER_CODE_KEY) || '',
      paymentMethod: sessionStorage.getItem(PAYMENT_METHOD_KEY) || '',
    }
  } catch {
    return { orderCode: '', paymentMethod: '' }
  }
}

export function clearCheckoutOrderSession() {
  try {
    sessionStorage.removeItem(ORDER_CODE_KEY)
    sessionStorage.removeItem(PAYMENT_METHOD_KEY)
  } catch {
    /* ignore */
  }
}
