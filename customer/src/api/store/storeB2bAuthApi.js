import { apiJson } from '../httpClient'

/**
 * @typedef {object} StoreB2bCustomerProfile
 * @property {number} id
 * @property {string} customerType
 * @property {string} fullName
 * @property {string | null} email
 * @property {string} phone
 * @property {string} [companyName]
 * @property {string} [taxCode]
 * @property {string} [companyAddress]
 * @property {number} [debtBalance]
 */

/**
 * @typedef {object} StoreB2bAuthPayload
 * @property {string} accessToken
 * @property {string} expiresAtUtc
 * @property {StoreB2bCustomerProfile} customer
 */

/**
 * Đăng ký khách doanh nghiệp (B2B).
 * POST /api/store/b2b/auth/register
 *
 * @param {{
 *   fullName: string
 *   email: string
 *   phone: string
 *   password: string
 *   companyName: string
 *   taxCode: string
 *   companyAddress: string
 * }} body
 * @returns {Promise<StoreB2bAuthPayload>}
 */
export function storeB2bRegister(body) {
  return apiJson('/api/store/b2b/auth/register', {
    method: 'POST',
    json: body,
  }).then((r) => r.data)
}

/**
 * Đăng nhập khách doanh nghiệp (B2B).
 * POST /api/store/b2b/auth/login
 *
 * @param {{ email: string, password: string }} body
 * @returns {Promise<StoreB2bAuthPayload>}
 */
export function storeB2bLogin(body) {
  return apiJson('/api/store/b2b/auth/login', {
    method: 'POST',
    json: body,
  }).then((r) => r.data)
}

/**
 * Đăng nhập Google (B2B). Yêu cầu đã có tài khoản đối tác đăng ký trước.
 * POST /api/store/b2b/auth/google
 * @param {{ idToken: string }} body
 * @returns {Promise<StoreB2bAuthPayload>}
 */
export function storeB2bGoogleLogin(body) {
  return apiJson('/api/store/b2b/auth/google', {
    method: 'POST',
    json: body,
  }).then((r) => r.data)
}

/**
 * GET /api/store/b2b/auth/me — profile khách B2B (Bearer token B2B).
 * @param {string} token
 * @returns {Promise<StoreB2bCustomerProfile>}
 */
export function storeB2bFetchMe(token) {
  return apiJson('/api/store/b2b/auth/me', {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * PUT /api/store/b2b/auth/me — cập nhật hồ sơ khách B2B.
 *
 * @param {string} token
 * @param {{
 *   fullName: string
 *   email: string
 *   phone: string
 *   companyName: string
 *   taxCode: string
 *   companyAddress: string
 * }} body
 * @returns {Promise<StoreB2bCustomerProfile>}
 */
export function storeB2bUpdateMe(token, body) {
  return apiJson('/api/store/b2b/auth/me', {
    method: 'PUT',
    token,
    json: body,
  }).then((r) => r.data)
}
