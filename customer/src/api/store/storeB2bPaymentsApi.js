import { apiJson } from '../httpClient'

/**
 * GET /api/store/b2b/payments
 * @param {string} token
 * @param {{
 *   page?: number,
 *   pageSize?: number,
 *   invoiceId?: number | null,
 *   transactionType?: string | null,
 *   fromDate?: string | null,
 *   toDate?: string | null,
 * }} [params]
 */
export function storeB2bFetchPayments(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  if (params.invoiceId != null && Number.isFinite(Number(params.invoiceId)) && Number(params.invoiceId) > 0) {
    q.set('invoiceId', String(Math.floor(Number(params.invoiceId))))
  }
  const tt = params.transactionType != null ? String(params.transactionType).trim() : ''
  if (tt) q.set('transactionType', tt)
  const fd = params.fromDate != null ? String(params.fromDate).trim() : ''
  const td = params.toDate != null ? String(params.toDate).trim() : ''
  if (fd) q.set('fromDate', fd)
  if (td) q.set('toDate', td)
  return apiJson(`/api/store/b2b/payments?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/payments/{id}
 * @param {string} token
 * @param {number} paymentId
 */
export function storeB2bFetchPaymentById(token, paymentId) {
  const id = Math.floor(Number(paymentId))
  if (!Number.isFinite(id) || id <= 0) {
    return Promise.reject(new Error('ID giao dịch không hợp lệ.'))
  }
  return apiJson(`/api/store/b2b/payments/${id}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/payments/transfer-notifications
 * @param {string} token
 * @param {{ page?: number, pageSize?: number, status?: string | null }} [params]
 */
export function storeB2bFetchTransferNotifications(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const st = params.status != null ? String(params.status).trim() : ''
  if (st) q.set('status', st)
  return apiJson(`/api/store/b2b/payments/transfer-notifications?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/payments/bank-transfer-info
 * @param {string} token
 */
export function storeB2bFetchBankTransferInfo(token) {
  return apiJson('/api/store/b2b/payments/bank-transfer-info', {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * POST /api/store/b2b/payments/notify-transfer — khách B2B gửi thông báo chuyển khoản.
 * Validate sớm: `referenceCode` không rỗng, `amount` > 0; trim `note` / `attachmentUrl`,
 * chỉ gửi `invoiceId` khi là số dương.
 *
 * @param {string} token Bearer B2B
 * @param {{
 *   referenceCode: string,
 *   amount: number | string,
 *   note?: string | null,
 *   attachmentUrl?: string | null,
 *   invoiceId?: number | null,
 * }} body
 */
export function storeB2bPostNotifyTransfer(token, body) {
  const payload = {
    referenceCode: String(body.referenceCode ?? '').trim(),
    amount: Number(body.amount),
  }
  if (!payload.referenceCode) {
    return Promise.reject(new Error('Vui lòng nhập mã tham chiếu chuyển khoản.'))
  }
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return Promise.reject(new Error('Số tiền không hợp lệ.'))
  }
  const note = body.note != null ? String(body.note).trim() : ''
  if (note) payload.note = note
  const att = body.attachmentUrl != null ? String(body.attachmentUrl).trim() : ''
  if (att) payload.attachmentUrl = att
  const inv = body.invoiceId
  if (inv != null && Number.isFinite(Number(inv)) && Number(inv) > 0) {
    payload.invoiceId = Math.floor(Number(inv))
  }
  return apiJson('/api/store/b2b/payments/notify-transfer', {
    method: 'POST',
    token,
    json: payload,
  }).then((r) => r.data)
}
