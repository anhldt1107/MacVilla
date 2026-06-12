import { apiJson } from '../httpClient'

/**
 * GET /api/store/me/orders?page=&pageSize=&orderStatus=&paymentStatus=
 * @param {string} token
 * @param {{
 *   page?: number
 *   pageSize?: number
 *   orderStatus?: string
 *   paymentStatus?: string
 * }} [params]
 */
export function storeMeFetchOrders(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const os = params.orderStatus != null ? String(params.orderStatus).trim() : ''
  const ps = params.paymentStatus != null ? String(params.paymentStatus).trim() : ''
  if (os) q.set('orderStatus', os)
  if (ps) q.set('paymentStatus', ps)
  return apiJson(`/api/store/me/orders?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/me/orders/{orderCode}
 * @param {string} token
 * @param {string} orderCode
 */
export function storeMeFetchOrderByCode(token, orderCode) {
  const seg = encodeURIComponent(String(orderCode ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã đơn hàng.'))
  }
  return apiJson(`/api/store/me/orders/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/me/orders/{orderCode}/timeline
 * @param {string} token
 * @param {string} orderCode
 */
export function storeMeFetchOrderTimeline(token, orderCode) {
  const seg = encodeURIComponent(String(orderCode ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã đơn hàng.'))
  }
  return apiJson(`/api/store/me/orders/${seg}/timeline`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * POST /api/store/me/orders/{orderCode}/cancel
 * @param {string} token
 * @param {string} orderCode
 * @param {{ cancelReason: string }} body
 */
export function storeMeCancelOrder(token, orderCode, body) {
  const seg = encodeURIComponent(String(orderCode ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã đơn hàng.'))
  }
  return apiJson(`/api/store/me/orders/${seg}/cancel`, {
    method: 'POST',
    token,
    json: { cancelReason: String(body?.cancelReason ?? '').trim() },
  }).then((r) => r.data)
}

/**
 * POST /api/store/me/orders/{orderCode}/reorder
 * @param {string} token
 * @param {string} orderCode
 */
export function storeMeReorder(token, orderCode) {
  const seg = encodeURIComponent(String(orderCode ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã đơn hàng.'))
  }
  return apiJson(`/api/store/me/orders/${seg}/reorder`, {
    method: 'POST',
    token,
    json: {},
  }).then((r) => r.data)
}
