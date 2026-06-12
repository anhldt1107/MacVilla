/**
 * Trạng thái đơn B2C — StoreOrderDetailDto.orderStatus (theo guideline).
 * @param {string | null | undefined} raw
 */
export function customerOrderStatusLabel(raw) {
  if (raw == null || raw === '') return '—'
  const s = String(raw).trim()
  const map = {
    New: 'Mới tạo',
    AwaitingPayment: 'Chờ thanh toán',
    Confirmed: 'Đã xác nhận',
    Processing: 'Đang xử lý',
    ReadyToShip: 'Chuẩn bị giao',
    Shipped: 'Đang giao',
    Delivered: 'Đã giao',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy',
  }
  return map[s] || s
}

/**
 * @param {string | null | undefined} raw
 */
export function customerPaymentStatusLabel(raw) {
  if (raw == null || raw === '') return '—'
  const s = String(raw).trim()
  const map = {
    Unpaid: 'Chưa thanh toán',
    Paid: 'Đã thanh toán',
    PartiallyPaid: 'Thanh toán một phần',
    Partial: 'Thanh toán một phần',
    Refunded: 'Hoàn tiền',
    Pending: 'Chờ thanh toán',
  }
  return map[s] || s
}

/** @param {string | null | undefined} raw */
export function customerOrderStatusBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const s = String(raw).trim()
  const classes = {
    New: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    AwaitingPayment: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    Confirmed: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
    Processing: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300',
    ReadyToShip: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300',
    Shipped: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300',
    Delivered: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    Completed: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300',
    Cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return (
    classes[s] ||
    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
  )
}

/** @param {string | null | undefined} raw */
export function customerPaymentStatusBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const s = String(raw).trim()
  const classes = {
    Unpaid: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    Paid: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    PartiallyPaid: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
    Partial: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
    Refunded: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    Pending: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
  }
  return (
    classes[s] ||
    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
  )
}

const CAN_CANCEL_STATUSES = new Set([
  'New',
  'AwaitingPayment',
  'Confirmed',
  'Processing',
  'ReadyToShip',
])

/**
 * Trạng thái cho phép khách hủy (theo OrderStatuses.CanCancel trong guideline).
 * @param {string | null | undefined} orderStatus
 */
export function customerOrderCanCancel(orderStatus) {
  if (orderStatus == null || orderStatus === '') return false
  return CAN_CANCEL_STATUSES.has(String(orderStatus).trim())
}
