import { apiForm, apiJson } from '../httpClient'

/**
 * GET /api/store/me/warranty-tickets?page=&pageSize=&status=
 * @param {string} token
 * @param {{ page?: number, pageSize?: number, status?: string }} [params]
 */
export function storeMeFetchWarrantyTickets(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const st = params.status != null ? String(params.status).trim() : ''
  if (st) q.set('status', st)
  return apiJson(`/api/store/me/warranty-tickets?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/me/warranty-tickets/{ticketNumber}
 * @param {string} token
 * @param {string} ticketNumber
 */
export function storeMeFetchWarrantyTicketByNumber(token, ticketNumber) {
  const seg = encodeURIComponent(String(ticketNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã phiếu bảo hành.'))
  }
  return apiJson(`/api/store/me/warranty-tickets/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * POST /api/store/me/warranty-tickets — StoreB2BWarrantyClaimCreateDto
 * @param {string} token
 * @param {{
 *   warrantyTicketId?: number
 *   orderId?: number
 *   orderItemId?: number
 *   variantId: number
 *   defectDescription: string
 *   imagesUrl?: string | null
 * }} body
 */
export function storeMeCreateWarrantyClaim(token, body) {
  const variantId = Number(body?.variantId)
  if (!Number.isFinite(variantId) || variantId <= 0) {
    return Promise.reject(new Error('Chọn sản phẩm.'))
  }
  const orderItemId = Number(body?.orderItemId)
  const hasOrderItem =
    body?.orderItemId != null && Number.isFinite(orderItemId) && orderItemId > 0
  const defectDescription = String(body?.defectDescription ?? '').trim()
  if (!defectDescription) {
    return Promise.reject(new Error('Nhập mô tả lỗi.'))
  }
  const wid = body?.warrantyTicketId
  const oid = body?.orderId
  const hasTicket = wid != null && Number.isFinite(Number(wid)) && Number(wid) > 0
  const hasOrder = oid != null && Number.isFinite(Number(oid)) && Number(oid) > 0
  if (!hasTicket && !hasOrder) {
    return Promise.reject(new Error('Thiếu phiếu bảo hành hoặc đơn hàng.'))
  }
  const json = {
    variantId,
    defectDescription,
    imagesUrl:
      body?.imagesUrl != null && String(body.imagesUrl).trim() !== ''
        ? String(body.imagesUrl).trim()
        : null,
  }
  if (hasTicket) json.warrantyTicketId = Number(wid)
  if (hasOrder) json.orderId = Number(oid)
  if (hasOrderItem) json.orderItemId = orderItemId

  return apiJson('/api/store/me/warranty-tickets', {
    method: 'POST',
    token,
    json,
  }).then((r) => r.data)
}

/** Tối đa số file ảnh/chứng từ cho một yêu cầu bảo hành (khớp UX modal). */
export const MAX_WARRANTY_EVIDENCE_FILES = 8

/**
 * POST /api/store/me/uploads — một file; lặp trên FE cho nhiều tệp.
 * @param {string} token
 * @param {File} file
 * @returns {Promise<Record<string, unknown>>}
 */
export function storeMeUploadWarrantyEvidence(token, file) {
  if (!(file instanceof File)) {
    return Promise.reject(new Error('Chọn file hợp lệ để tải lên.'))
  }
  const fd = new FormData()
  fd.append('file', file)
  return apiForm('/api/store/me/uploads', { token, body: fd }).then((r) => {
    const d = r?.data
    if (d && typeof d === 'object') return d
    return {}
  })
}
