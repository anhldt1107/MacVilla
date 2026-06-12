import { apiJson } from '../httpClient'

/**
 * GET /api/store/me/invoices/{invoiceNumber}
 * @param {string} token
 * @param {string} invoiceNumber
 */
export function storeMeFetchInvoiceByNumber(token, invoiceNumber) {
  const seg = encodeURIComponent(String(invoiceNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu số hóa đơn.'))
  }
  return apiJson(`/api/store/me/invoices/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/me/invoices/{invoiceNumber}/pdf
 * @param {string} token
 * @param {string} invoiceNumber
 */
export function storeMeFetchInvoicePdfUrl(token, invoiceNumber) {
  const seg = encodeURIComponent(String(invoiceNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu số hóa đơn.'))
  }
  return apiJson(`/api/store/me/invoices/${seg}/pdf`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}
