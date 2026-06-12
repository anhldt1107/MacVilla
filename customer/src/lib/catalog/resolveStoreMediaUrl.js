import { API_BASE_URL } from '../../api/config'

/**
 * Chuẩn hoá URL ảnh/media từ store API (relative → có base).
 * @param {string | null | undefined} imageUrl
 */
export function resolveStoreMediaUrl(imageUrl) {
  const v = String(imageUrl ?? '').trim()
  if (!v) return ''
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v
  const base = String(API_BASE_URL || '').replace(/\/$/, '')
  if (!base) return v.startsWith('/') ? v : `/${v}`
  return v.startsWith('/') ? `${base}${v}` : `${base}/${v}`
}
