/**
 * Nhãn hiển thị trạng thái hợp đồng B2B (Store) — fallback raw nếu BE thêm giá trị mới.
 * @param {string | null | undefined} raw
 */
export function contractStatusLabel(raw) {
  if (raw == null || raw === '') return '—'
  const s = String(raw).trim()
  const map = {
    Draft: 'Nháp',
    PendingConfirmation: 'Chờ khách xác nhận',
    Confirmed: 'Đã xác nhận',
    Active: 'Hiệu lực',
    Expired: 'Hết hiệu lực',
    Cancelled: 'Đã hủy',
    Completed: 'Hoàn tất',
  }
  return map[s] || s
}

/** @param {string | null | undefined} raw */
export function contractStatusBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const s = String(raw).trim()
  const classes = {
    Draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    PendingConfirmation:
      'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    Confirmed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    Active: 'bg-primary/15 text-primary dark:bg-primary/25',
    Expired: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    Cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
    Completed: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
  }
  return (
    classes[s] ||
    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
  )
}

/**
 * Chỉ cho phép xác nhận khi BE đặt trạng thái chờ khách (chuẩn hoá PascalCase).
 * @param {string | null | undefined} raw
 */
export function contractAllowsCustomerConfirm(raw) {
  if (raw == null || raw === '') return false
  const s = String(raw).trim()
  return s === 'PendingConfirmation'
}
