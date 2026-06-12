const STORAGE_KEY = 'macvilla_store_auth'
const LEGACY_STORAGE_KEY = 'hdg_viethan_store_auth'
const LEGACY_USER_KEY = 'hdg_viethan_user'

/**
 * @typedef {object} PersistedStoreSession
 * @property {string} accessToken
 * @property {string} expiresAtUtc
 * @property {object} customer
 */

/**
 * @returns {PersistedStoreSession | null}
 */
export function loadStoreSession() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
    }
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.accessToken || !data?.customer) return null
    return data
  } catch {
    return null
  }
}

/** @param {PersistedStoreSession | null} session */
export function saveStoreSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/** Xóa session + key cũ (rebrand / mock) */
export function clearStoreSession() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}

/**
 * @param {string} expiresAtUtc - ISO từ BE
 */
export function isSessionExpired(expiresAtUtc) {
  if (!expiresAtUtc) return true
  const t = new Date(expiresAtUtc).getTime()
  if (Number.isNaN(t)) return true
  return Date.now() >= t
}
