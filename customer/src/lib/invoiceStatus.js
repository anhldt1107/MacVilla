/**
 * @param {string | null | undefined} raw
 */
export function invoiceStatusLabel(raw) {
  if (raw == null || raw === '') return '—'
  const s = String(raw).trim()
  const map = {
    Draft: 'Nháp',
    Issued: 'Đã phát hành',
    Paid: 'Đã thanh toán đủ',
    Unpaid: 'Chưa thanh toán',
    Partial: 'Thanh toán một phần',
    PartiallyPaid: 'Thanh toán một phần',
    Overdue: 'Quá hạn',
    Cancelled: 'Đã hủy',
  }
  return map[s] || s
}

/** @param {string | null | undefined} raw */
export function invoiceStatusBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const s = String(raw).trim()
  const classes = {
    Paid: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    Unpaid: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    Partial: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
    PartiallyPaid:
      'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
    Overdue: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300',
    Draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
    Issued: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
    Cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return (
    classes[s] ||
    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
  )
}

/**
 * Màu cảnh báo theo daysUntilDue (âm = quá hạn).
 * @param {number | null | undefined} days
 */
export function invoiceDaysUntilDueClass(days) {
  if (days == null || Number.isNaN(Number(days))) {
    return 'text-slate-600 dark:text-slate-400'
  }
  const n = Number(days)
  if (n < 0) return 'text-red-600 dark:text-red-400 font-bold'
  if (n <= 7) return 'text-amber-600 dark:text-amber-400 font-semibold'
  return 'text-slate-700 dark:text-slate-300'
}
