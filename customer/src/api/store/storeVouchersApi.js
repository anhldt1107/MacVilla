import { apiJson } from '../httpClient'

/**
 * POST /api/store/vouchers/validate — Anonymous (không cần token).
 * @param {{ code: string, subTotal?: number }} body
 */
export function storeValidateVoucher(body) {
  const code = String(body?.code ?? '').trim()
  if (!code) {
    return Promise.reject(new Error('Nhập mã voucher.'))
  }
  const json = { code }
  if (body?.subTotal != null && Number.isFinite(Number(body.subTotal))) {
    json.subTotal = Number(body.subTotal)
  }
  return apiJson('/api/store/vouchers/validate', {
    method: 'POST',
    json,
  }).then((r) => r.data)
}
