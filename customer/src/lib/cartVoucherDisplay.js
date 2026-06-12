/**
 * Hiển thị gợi ý voucher giỏ — `GET /api/store/me/cart/vouchers` (StoreCartVoucherListItemDto).
 */

export function formatVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + 'đ'
}

/**
 * Mô tả nhanh rule giảm (trước khi áp trần).
 * @param {Record<string, unknown>} row
 */
export function cartVoucherDiscountRuleLabel(row) {
  if (!row || typeof row !== 'object') return '—'
  const dt = String(row.discountType ?? '')
    .trim()
    .toLowerCase()
  const dv = row.discountValue
  const num = dv != null && Number.isFinite(Number(dv)) ? Number(dv) : null
  if (dt === 'percentage' || dt === 'percent') {
    return num != null ? `Giảm ${num}%` : 'Giảm %'
  }
  if (dt === 'fixedamount' || dt === 'fixed') {
    return num != null ? `Giảm ${formatVnd(num)}` : 'Giảm cố định'
  }
  return 'Ưu đãi'
}
