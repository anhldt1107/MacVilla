import { apiJson } from '../httpClient'

/**
 * POST /api/store/b2b/quotes/requests
 * @param {string} token Bearer B2B
 * @param {{
 *   items: { variantId: number, quantity: number }[]
 *   notes?: string | null
 * }} body
 */
export function storeB2bCreateQuoteRequest(token, body) {
  return apiJson('/api/store/b2b/quotes/requests', {
    method: 'POST',
    token,
    json: body,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/quotes?page=&pageSize=
 *
 * `status` (chuỗi, khuyến nghị PascalCase): Requested → Draft → PendingApproval → Approved | Rejected;
 * Approved → CustomerAccepted | CustomerRejected | CounterOffer | Expired; CounterOffer → Draft;
 * CustomerAccepted → Converted. Thêm Cancelled nếu có. Chuẩn hoá hiển thị: `src/lib/quotationStatus.js`.
 *
 * @param {string} token Bearer B2B
 * @param {{ page?: number, pageSize?: number, status?: string }} [params]
 * @returns {Promise<{
 *   items: Array<{
 *     id: number
 *     quoteCode: string
 *     createdAt: string
 *     status: string
 *     lineCount: number
 *     totalAmount: number
 *     finalAmount: number
 *     validUntil: string | null
 *     salesName: string | null
 *   }>
 *   totalCount: number
 *   page: number
 *   pageSize: number
 * }>}
 */
export function storeB2bFetchQuotes(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const st = params.status != null ? String(params.status).trim() : ''
  if (st) {
    q.set('status', st)
  }
  return apiJson(`/api/store/b2b/quotes?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/quotes/{quoteCode}
 * Trường `status` cùng bộ giá trị như danh sách báo giá (`quotationStatus.js`).
 * @param {string} token Bearer B2B
 * @param {string} quoteCode — ví dụ QT20260412402783
 */
export function storeB2bFetchQuoteByCode(token, quoteCode) {
  const seg = encodeURIComponent(String(quoteCode ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã báo giá.'))
  }
  return apiJson(`/api/store/b2b/quotes/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * POST /api/store/b2b/quotes/{id}/counter-offer — khi báo giá đã Approved.
 *
 * @param {string} token Bearer B2B
 * @param {number} quoteId — id số (không phải quoteCode)
 * @param {{
 *   message: string
 *   items: { variantId: number, desiredQuantity: number, desiredUnitPrice: number }[]
 * }} body
 */
export function storeB2bPostCounterOffer(token, quoteId, body) {
  const id = Number(quoteId)
  if (!Number.isFinite(id) || id <= 0) {
    return Promise.reject(new Error('ID báo giá không hợp lệ.'))
  }
  const items = body.items ?? []
  /** @type {{ message: string, items?: object[] }} */
  const json = {
    message: String(body.message ?? '').trim(),
  }
  if (items.length > 0) {
    json.items = items.map((it) => {
      const variantId = Math.floor(Number(it.variantId))
      const o = { variantId }
      if (it.desiredQuantity != null && it.desiredQuantity !== '') {
        o.desiredQuantity = Math.max(1, Math.floor(Number(it.desiredQuantity)) || 1)
      }
      if (it.desiredUnitPrice != null && it.desiredUnitPrice !== '') {
        o.desiredUnitPrice = Number(it.desiredUnitPrice)
      }
      return o
    })
  }
  return apiJson(`/api/store/b2b/quotes/${id}/counter-offer`, {
    method: 'POST',
    token,
    json,
  }).then((r) => r.data)
}

/**
 * POST /api/store/b2b/quotes/{id}/accept — khi báo giá đã Approved.
 * @param {string} token Bearer B2B
 * @param {number} quoteId
 */
export function storeB2bPostQuoteAccept(token, quoteId) {
  const id = Number(quoteId)
  if (!Number.isFinite(id) || id <= 0) {
    return Promise.reject(new Error('ID báo giá không hợp lệ.'))
  }
  return apiJson(`/api/store/b2b/quotes/${id}/accept`, {
    method: 'POST',
    token,
    json: {},
  }).then((r) => r.data)
}

/**
 * POST /api/store/b2b/quotes/{id}/reject — khi báo giá đã Approved.
 * @param {string} token Bearer B2B
 * @param {number} quoteId
 * @param {{ reason: string }} body
 */
export function storeB2bPostQuoteReject(token, quoteId, body) {
  const id = Number(quoteId)
  if (!Number.isFinite(id) || id <= 0) {
    return Promise.reject(new Error('ID báo giá không hợp lệ.'))
  }
  return apiJson(`/api/store/b2b/quotes/${id}/reject`, {
    method: 'POST',
    token,
    json: {
      reason: String(body?.reason ?? '').trim(),
    },
  }).then((r) => r.data)
}
