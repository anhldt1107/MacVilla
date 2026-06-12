import { apiJson } from '../httpClient'

/**
 * GET /api/store/b2b/debt/summary
 * @param {string} token
 * @returns {Promise<Record<string, unknown>>}
 */
export function storeB2bFetchDebtSummary(token) {
  return apiJson('/api/store/b2b/debt/summary', {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/invoices?page=&pageSize=&status=
 * @param {string} token
 * @param {{ page?: number, pageSize?: number, status?: string }} [params]
 */
export function storeB2bFetchInvoices(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const st = params.status != null ? String(params.status).trim() : ''
  if (st) q.set('status', st)
  return apiJson(`/api/store/b2b/invoices?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/invoices/{invoiceNumber}
 * @param {string} token
 * @param {string} invoiceNumber
 */
export function storeB2bFetchInvoiceByNumber(token, invoiceNumber) {
  const seg = encodeURIComponent(String(invoiceNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu số hóa đơn.'))
  }
  return apiJson(`/api/store/b2b/invoices/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/invoices/{invoiceNumber}/pdf
 * Trả `data` có `pdfUrl` khi thành công; `success: false` → apiJson ném ApiError với message.
 * @param {string} token
 * @param {string} invoiceNumber
 */
export function storeB2bFetchInvoicePdfUrl(token, invoiceNumber) {
  const seg = encodeURIComponent(String(invoiceNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu số hóa đơn.'))
  }
  return apiJson(`/api/store/b2b/invoices/${seg}/pdf`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}
