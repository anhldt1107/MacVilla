import { apiJson } from '../httpClient'

/**
 * GET /api/store/me/payments?page=&pageSize=&invoiceId&transactionType=&fromDate=&toDate=
 * @param {string} token
 * @param {{
 *   page?: number
 *   pageSize?: number
 *   invoiceId?: number
 *   transactionType?: string
 *   fromDate?: string
 *   toDate?: string
 * }} [params]
 */
export function storeMeFetchPayments(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))

  if (params.invoiceId != null && Number.isFinite(Number(params.invoiceId))) {
    q.set('invoiceId', String(Number(params.invoiceId)))
  }
  const tt = params.transactionType != null ? String(params.transactionType).trim() : ''
  if (tt) q.set('transactionType', tt)
  const fd = params.fromDate != null ? String(params.fromDate).trim() : ''
  const td = params.toDate != null ? String(params.toDate).trim() : ''
  if (fd) q.set('fromDate', fd)
  if (td) q.set('toDate', td)

  return apiJson(`/api/store/me/payments?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/me/payments/{id}
 * @param {string} token
 * @param {number | string} id
 */
export function storeMeFetchPaymentById(token, id) {
  const raw = id != null ? String(id).trim() : ''
  if (!raw || !Number.isFinite(Number(raw))) {
    return Promise.reject(new Error('Thiếu mã giao dịch.'))
  }
  return apiJson(`/api/store/me/payments/${encodeURIComponent(raw)}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}
