import { apiJson } from '../httpClient'

/**
 * GET /api/store/me/return-requests?page=&pageSize=&status=&type=
 * @param {string} token
 * @param {{
 *   page?: number
 *   pageSize?: number
 *   status?: string
 *   type?: string
 * }} [params]
 */
export function storeMeFetchReturnExchangeRequests(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const st = params.status != null ? String(params.status).trim() : ''
  const ty = params.type != null ? String(params.type).trim() : ''
  if (st) q.set('status', st)
  if (ty) q.set('type', ty)
  return apiJson(`/api/store/me/return-requests?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/me/return-requests/{ticketNumber}
 * @param {string} token
 * @param {string} ticketNumber
 */
export function storeMeFetchReturnExchangeByTicket(token, ticketNumber) {
  const seg = encodeURIComponent(String(ticketNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã phiếu.'))
  }
  return apiJson(`/api/store/me/return-requests/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * POST /api/store/me/return-requests
 * @param {string} token
 * @param {Record<string, unknown>} body
 */
export function storeMeCreateReturnExchangeRequest(token, body) {
  return apiJson('/api/store/me/return-requests', {
    method: 'POST',
    token,
    json: body,
  }).then((r) => r.data)
}

/**
 * PUT /api/store/me/return-requests/{ticketNumber}/cancel
 * @param {string} token
 * @param {string} ticketNumber
 */
export function storeMeCancelReturnExchangeRequest(token, ticketNumber) {
  const seg = encodeURIComponent(String(ticketNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã phiếu.'))
  }
  return apiJson(`/api/store/me/return-requests/${seg}/cancel`, {
    method: 'PUT',
    token,
  }).then((r) => r.data)
}
