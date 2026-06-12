import { apiJson } from '../httpClient'

/**
 * GET /api/store/b2b/contracts?page=&pageSize=&status=
 * @param {string} token
 * @param {{ page?: number, pageSize?: number, status?: string }} [params]
 */
export function storeB2bFetchContracts(token, params = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('pageSize', String(pageSize))
  const st = params.status != null ? String(params.status).trim() : ''
  if (st) q.set('status', st)
  return apiJson(`/api/store/b2b/contracts?${q.toString()}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/contracts/{contractNumber}
 * @param {string} token
 * @param {string} contractNumber
 */
export function storeB2bFetchContractByNumber(token, contractNumber) {
  const seg = encodeURIComponent(String(contractNumber ?? '').trim())
  if (!seg) {
    return Promise.reject(new Error('Thiếu mã hợp đồng.'))
  }
  return apiJson(`/api/store/b2b/contracts/${seg}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * POST /api/store/b2b/contracts/{id}/confirm
 * Body optional: { notes?: string }
 * @param {string} token
 * @param {number} id
 * @param {{ notes?: string } | null} [body]
 */
export function storeB2bConfirmContract(token, id, body = null) {
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) {
    return Promise.reject(new Error('ID hợp đồng không hợp lệ.'))
  }
  const notes =
    body && typeof body === 'object' && body.notes != null
      ? String(body.notes).trim()
      : ''
  const json = notes ? { notes } : {}
  return apiJson(`/api/store/b2b/contracts/${n}/confirm`, {
    method: 'POST',
    token,
    json,
  }).then((r) => r.data)
}
