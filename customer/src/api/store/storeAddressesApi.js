import { apiJson } from '../httpClient'

/**
 * GET /api/store/me/addresses
 * @param {string} token
 * @returns {Promise<object[]>} StoreAddressDto[] (camelCase)
 */
export function storeFetchAddresses(token) {
  return apiJson('/api/store/me/addresses', {
    method: 'GET',
    token,
  }).then((r) => (Array.isArray(r.data) ? r.data : []))
}

/**
 * POST /api/store/me/addresses
 *
 * Body (JSON): receiverName, receiverPhone, addressLine, isDefault.
 *
 * Envelope: { success, data: { id, receiverName, receiverPhone, addressLine, isDefault }, message, errorCode, errors, … }
 *
 * @param {string} token
 * @param {{ receiverName: string, receiverPhone: string, addressLine: string, isDefault?: boolean }} body
 * @returns {Promise<{ id: number, receiverName: string, receiverPhone: string, addressLine: string, isDefault: boolean }|undefined>}
 */
function addressBodyJson(body) {
  return {
    receiverName: String(body.receiverName ?? '').trim(),
    receiverPhone: String(body.receiverPhone ?? '').trim(),
    addressLine: String(body.addressLine ?? '').trim(),
    isDefault: Boolean(body.isDefault),
  }
}

export function storeCreateAddress(token, body) {
  return apiJson('/api/store/me/addresses', {
    method: 'POST',
    token,
    json: addressBodyJson(body),
  }).then((r) => r.data)
}

/**
 * PUT /api/store/me/addresses/{id}
 * @param {string} token
 * @param {number} id
 * @param {{ receiverName: string, receiverPhone: string, addressLine: string, isDefault?: boolean }} body
 */
export function storeUpdateAddress(token, id, body) {
  return apiJson(`/api/store/me/addresses/${Number(id)}`, {
    method: 'PUT',
    token,
    json: addressBodyJson(body),
  }).then((r) => r.data)
}

/**
 * DELETE /api/store/me/addresses/{id}
 * @param {string} token
 * @param {number} id
 */
export function storeDeleteAddress(token, id) {
  return apiJson(`/api/store/me/addresses/${Number(id)}`, {
    method: 'DELETE',
    token,
  }).then((r) => r.data)
}

/**
 * POST /api/store/me/addresses/{id}/set-default
 * @param {string} token
 * @param {number} id
 */
export function storeSetDefaultAddress(token, id) {
  return apiJson(`/api/store/me/addresses/${Number(id)}/set-default`, {
    method: 'POST',
    token,
    json: {},
  }).then((r) => r.data)
}
