/**
 * Máy trạng thái báo giá (B2B):
 * Requested → Draft (tiếp nhận) → PendingApproval (gửi duyệt) → Approved | Rejected (QL);
 * Approved → CustomerAccepted | CustomerRejected | CounterOffer | Expired;
 * CounterOffer → Draft;
 * CustomerAccepted → Converted (đơn hàng).
 */

/** @typedef {'Requested'|'Draft'|'PendingApproval'|'Approved'|'Rejected'|'CustomerAccepted'|'CustomerRejected'|'CounterOffer'|'Expired'|'Converted'|'Cancelled'} QuotationStatusCanonical */

/**
 * Mã trạng thái chuẩn (API) dùng cho dropdown lọc lịch sử báo giá — một nguồn duy nhất.
 * Gồm: Requested, Approved, CustomerAccepted, CustomerRejected, CounterOffer, Converted, Expired
 * và các bước nội bộ Draft, PendingApproval, Rejected, Cancelled.
 *
 * @type {readonly QuotationStatusCanonical[]}
 */
export const QUOTATION_HISTORY_STATUS_FILTER_KEYS = [
  'Requested',
  'Draft',
  'PendingApproval',
  'Approved',
  'Rejected',
  'CustomerAccepted',
  'CustomerRejected',
  'CounterOffer',
  'Converted',
  'Expired',
  'Cancelled',
]

const ALIASES = {
  requested: 'Requested',
  draft: 'Draft',
  pendingapproval: 'PendingApproval',
  pending_approval: 'PendingApproval',
  'pending approval': 'PendingApproval',
  approved: 'Approved',
  rejected: 'Rejected',
  customeraccepted: 'CustomerAccepted',
  customer_accepted: 'CustomerAccepted',
  customerrejected: 'CustomerRejected',
  customer_rejected: 'CustomerRejected',
  counteroffer: 'CounterOffer',
  counter_offer: 'CounterOffer',
  expired: 'Expired',
  converted: 'Converted',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  cancel: 'Cancelled',
}

/**
 * Chuẩn hoá status từ API (PascalCase, snake_case, v.v.).
 * @param {string | null | undefined} raw
 * @returns {QuotationStatusCanonical | string}
 */
export function normalizeQuotationStatus(raw) {
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  const key = s.toLowerCase().replace(/[\s-]+/g, '')
  const fromAlias = ALIASES[key]
  if (fromAlias) return fromAlias
  const compact = s.replace(/\s+/g, '')
  if (/^[A-Za-z]+$/.test(compact) && compact[0] === compact[0].toUpperCase()) {
    return s
  }
  return s
}

/** @param {string | null | undefined} raw */
export function quoteStatusLabel(raw) {
  const s = normalizeQuotationStatus(raw)
  const map = {
    Requested: 'Đã gửi yêu cầu',
    Draft: 'Tiếp nhận (soạn báo giá)',
    PendingApproval: 'Gửi duyệt (chờ QL)',
    Approved: 'Đã duyệt — chờ phản hồi của bạn',
    Rejected: 'Từ chối (quản lý)',
    CustomerAccepted: 'Đã đồng ý báo giá',
    CustomerRejected: 'Đã từ chối báo giá',
    CounterOffer: 'Trao đổi / Đề xuất lại',
    Expired: 'Hết hạn',
    Converted: 'Đã chuyển đơn',
    Cancelled: 'Đã hủy',
  }
  return map[s] || (raw ? String(raw).trim() : '—')
}

/** @param {string | null | undefined} raw */
export function statusBadgeClass(raw) {
  const s = normalizeQuotationStatus(raw)
  const classes = {
    Requested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    Draft: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
    PendingApproval: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
    Approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    CustomerAccepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CustomerRejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    CounterOffer: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    Expired: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    Converted: 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary',
    Cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return classes[s] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
}

/**
 * Tab lịch sử báo giá (id khớp `B2B_QUOTATION_HISTORY_TABS`).
 * @param {string | null | undefined} rawStatus
 * @param {string} tabId
 */
export function quoteMatchesHistoryTab(rawStatus, tabId) {
  const s = normalizeQuotationStatus(rawStatus)
  if (tabId === 'all') return true
  if (tabId === 'pre_customer') {
    return ['Requested', 'Draft', 'PendingApproval', 'CounterOffer'].includes(s)
  }
  if (tabId === 'awaiting_customer') return s === 'Approved'
  if (tabId === 'won') return s === 'CustomerAccepted' || s === 'Converted'
  if (tabId === 'lost') {
    return ['Rejected', 'CustomerRejected', 'Expired', 'Cancelled'].includes(s)
  }
  return true
}

/**
 * Thông báo ngắn cho khách hàng doanh nghiệp (trang chi tiết).
 * @param {string | null | undefined} rawStatus
 * @returns {{ tone: 'info'|'success'|'warning'|'danger', text: string } | null}
 */
export function quotationStatusCustomerNotice(rawStatus) {
  const s = normalizeQuotationStatus(rawStatus)
  const map = {
    Requested: {
      tone: 'info',
      text: 'Yêu cầu đã được gửi. Đội kinh doanh sẽ tiếp nhận và soạn báo giá.',
    },
    Draft: {
      tone: 'info',
      text: 'Báo giá đang được đội kinh doanh soạn thảo sau khi tiếp nhận yêu cầu.',
    },
    PendingApproval: {
      tone: 'warning',
      text: 'Báo giá đã được gửi duyệt và đang chờ quản lý phê duyệt.',
    },
    Approved: {
      tone: 'success',
      text: 'Quản lý đã duyệt. Vui lòng phản hồi: chấp nhận, từ chối hoặc trao đổi điều chỉnh (counter-offer).',
    },
    Rejected: {
      tone: 'danger',
      text: 'Quản lý đã từ chối báo giá này.',
    },
    CustomerAccepted: {
      tone: 'success',
      text: 'Bạn đã chấp nhận báo giá. Hệ thống có thể chuyển sang đơn hàng (Converted) khi hoàn tất.',
    },
    CustomerRejected: {
      tone: 'danger',
      text: 'Bạn đã từ chối báo giá.',
    },
    CounterOffer: {
      tone: 'warning',
      text: 'Đã ghi nhận phản hồi thương lượng. Vui lòng chờ báo giá cập nhật.',
    },
    Expired: {
      tone: 'danger',
      text: 'Báo giá đã hết hiệu lực.',
    },
    Converted: {
      tone: 'success',
      text: 'Báo giá đã được chuyển thành đơn hàng.',
    },
    Cancelled: {
      tone: 'danger',
      text: 'Yêu cầu / báo giá đã hủy.',
    },
  }
  return map[s] || null
}
