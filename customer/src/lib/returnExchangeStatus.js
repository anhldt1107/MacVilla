/**
 * @param {string | null | undefined} raw
 */
export function returnExchangeTypeLabel(raw) {
  if (raw == null || raw === '') return '—'
  const s = String(raw).trim()
  if (s === 'Return') return 'Trả hàng'
  if (s === 'Exchange') return 'Đổi hàng'
  return s
}

/**
 * @param {string | null | undefined} raw
 */
export function returnExchangeTypeBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const s = String(raw).trim()
  if (s === 'Return') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
  }
  if (s === 'Exchange') {
    return 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300'
  }
  return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
}

/**
 * Trạng thái phiếu đổi/trả (theo ReturnTicketStatuses BE).
 * @param {string | null | undefined} raw
 */
export function returnExchangeStatusLabel(raw) {
  if (raw == null || raw === '') return '—'
  const s = String(raw).trim()
  const map = {
    Requested: 'Yêu cầu đổi trả',
    PendingApproval: 'Chờ duyệt',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối',
    Processing: 'Đang thu hồi',
    ItemsReceived: 'Đã nhận hàng',
    Completed: 'Hoàn tất',
    Cancelled: 'Đã hủy',
    Draft: 'Nháp',
    Pending: 'Chờ xử lý',
    Submitted: 'Đã gửi',
    UnderReview: 'Đang xem xét',
    Closed: 'Đã đóng',
  }
  return map[s] || s
}

/** @param {string | null | undefined} raw */
export function returnExchangeStatusBadgeClass(raw) {
  if (raw == null || raw === '') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
  const s = String(raw).trim()
  const ok = {
    Requested: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
    PendingApproval: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    Approved: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    Completed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    ItemsReceived: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300',
    Processing: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300',
    Rejected: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300',
    Cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
    Pending: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    Submitted: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
    UnderReview: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
    Draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
    Closed: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  }
  return ok[s] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
}

/** Khách hủy khi Requested hoặc PendingApproval. */
export function returnExchangeAllowsCustomerCancel(status) {
  const s = String(status ?? '').trim()
  return s === 'Requested' || s === 'PendingApproval'
}

const STEPS = [
  { key: 'requested', match: ['requested', 'pendingapproval'] },
  { key: 'approved', match: ['approved'] },
  { key: 'processing', match: ['processing'] },
  { key: 'itemsreceived', match: ['itemsreceived'] },
  { key: 'completed', match: ['completed'] },
]

function normStatus(s) {
  return String(s ?? '').trim().replace(/\s+/g, '').toLowerCase()
}

function returnStepIndex(status) {
  const n = normStatus(status)
  if (n.includes('reject') || n.includes('cancel')) return -1
  const idx = STEPS.findIndex((st) => st.match.some((m) => n === m || n.includes(m)))
  return idx >= 0 ? idx : 0
}

const STEP_LABELS = {
  requested: 'Yêu cầu',
  approved: 'Đã duyệt',
  processing: 'Thu hồi',
  itemsreceived: 'Đã nhận hàng',
  completed: 'Hoàn tất',
}

/**
 * @param {string | null | undefined} status
 */
export function returnExchangeStepLabels(status) {
  const cur = returnStepIndex(status)
  const terminal = normStatus(status).includes('reject') || normStatus(status).includes('cancel')
  if (terminal) return { terminal: true, steps: [], current: -1 }
  return {
    terminal: false,
    current: cur,
    steps: STEPS.map((st) => STEP_LABELS[/** @type {keyof typeof STEP_LABELS} */ (st.key)]),
  }
}
