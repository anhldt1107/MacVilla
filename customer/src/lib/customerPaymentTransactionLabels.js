/**
 * Thu / chi theo guideline: Payment, AdjustmentIncrease → thu; Refund, AdjustmentDecrease → chi.
 * @param {string | null | undefined} transactionType
 */
export function paymentTransactionIsIncoming(transactionType) {
  if (transactionType == null || transactionType === '') return true
  const t = String(transactionType).trim()
  return t === 'Payment' || t === 'AdjustmentIncrease'
}

/**
 * @param {string | null | undefined} raw
 */
export function paymentTransactionTypeLabel(raw) {
  if (raw == null || raw === '') return '—'
  const s = String(raw).trim()
  const map = {
    Payment: 'Thanh toán',
    Refund: 'Hoàn tiền',
    AdjustmentIncrease: 'Điều chỉnh tăng',
    AdjustmentDecrease: 'Điều chỉnh giảm',
  }
  return map[s] || s.replace(/_/g, ' ')
}

/** Icon Material: thu vs chi */
export function paymentTransactionFlowIcon(transactionType) {
  return paymentTransactionIsIncoming(transactionType) ? 'south_west' : 'north_east'
}

/**
 * @param {string | null | undefined} raw
 */
export function paymentTransactionTypeBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const s = String(raw).trim()
  const incoming = s === 'Payment' || s === 'AdjustmentIncrease'
  if (incoming) {
    return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300'
  }
  return 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300'
}
