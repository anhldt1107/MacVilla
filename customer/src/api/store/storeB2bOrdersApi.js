import { apiJson } from '../httpClient'

/**
 * GET /api/store/b2b/orders?page=&pageSize=&orderStatus=&paymentStatus=
 * @param {string} token
 * @param {{
 *   page?: number
 *   pageSize?: number
 *   orderStatus?: string
 *   paymentStatus?: string
 * }} [params]
 */
export function storeB2bFetchOrders(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const os = params.orderStatus != null ? String(params.orderStatus).trim() : ''
  const ps = params.paymentStatus != null ? String(params.paymentStatus).trim() : ''
  if (os) q.set('orderStatus', os)
  if (ps) q.set('paymentStatus', ps)
  return apiJson(`/api/store/b2b/orders?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/orders/{orderCode}
 * @param {string} token
 * @param {string} orderCode
 */
export function storeB2bFetchOrderByCode(token, orderCode) {
  const seg = encodeURIComponent(String(orderCode ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã đơn hàng.'))
  }
  return apiJson(`/api/store/b2b/orders/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/orders/{orderCode}/timeline
 * @param {string} token
 * @param {string} orderCode
 */
export function storeB2bFetchOrderTimeline(token, orderCode) {
  const seg = encodeURIComponent(String(orderCode ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã đơn hàng.'))
  }
  return apiJson(`/api/store/b2b/orders/${seg}/timeline`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}
