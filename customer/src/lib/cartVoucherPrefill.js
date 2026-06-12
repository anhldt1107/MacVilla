/** Khóa sessionStorage: chọn mã trên giỏ → prefill ô voucher ở checkout. */
export const CART_VOUCHER_PREFILL_KEY = 'macvilla_checkout_voucher_prefill'

/**
 * @param {string} code
 */
export function setCartVoucherPrefill(code) {
  const c = String(code ?? '').trim()
  if (!c) return
  try {
    sessionStorage.setItem(CART_VOUCHER_PREFILL_KEY, JSON.stringify({ code: c }))
  } catch {
    /* ignore */
  }
}
