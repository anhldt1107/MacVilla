import { API_BASE_URL } from '../../api/config'

/**
 * @typedef {{
 *   type: 'product' | 'order',
 *   title: string,
 *   subtitle?: string | null,
 *   imageUrl?: string | null,
 *   link?: string | null,
 *   meta?: Record<string, any>,
 * }} AiAttachment
 */

/** @param {string | null | undefined} v */
function trimSlash(v) {
  return String(v ?? '').trim().replace(/^\/+|\/+$/g, '')
}

/** Lấy đoạn cuối của path (sau dấu `/` cuối cùng). */
function tailOfPath(link) {
  const cleaned = trimSlash(link)
  if (!cleaned) return ''
  const parts = cleaned.split('/')
  return parts[parts.length - 1] || ''
}

/**
 * Map `attachment.link` (BE trả relative theo prefix `/store/...`) sang route thực tế của Macvilla-Customer.
 *
 * @param {AiAttachment} att
 * @param {'b2c' | 'b2b'} namespace
 * @returns {string | null} `null` nếu không suy ra được route hợp lệ.
 */
export function rewriteAttachmentLink(att, namespace) {
  if (!att) return null
  const meta = att.meta || {}
  const type = String(att.type || '').toLowerCase()

  if (type === 'product') {
    const slug = meta.slug != null ? String(meta.slug).trim() : ''
    if (slug) return `/products/${encodeURIComponent(slug)}`
    const productId = meta.productId
    if (productId != null && String(productId).trim() !== '') {
      return `/products/${encodeURIComponent(String(productId))}`
    }
    const tail = tailOfPath(att.link)
    if (tail && tail !== 'id') return `/products/${encodeURIComponent(tail)}`
    return null
  }

  if (type === 'order') {
    const code = meta.orderCode != null ? String(meta.orderCode).trim() : ''
    const fallback = code || tailOfPath(att.link)
    if (!fallback) return null
    const safe = encodeURIComponent(fallback)
    if (namespace === 'b2b') return `/partner/orders/${safe}`
    return `/account/orders/${safe}`
  }

  return null
}

/**
 * Chuẩn hoá `imageUrl`:
 *   - rỗng / null → null (UI sẽ render placeholder)
 *   - absolute (`http(s)://`) hoặc `data:` → giữ nguyên
 *   - relative → prepend `API_BASE_URL`
 *
 * @param {string | null | undefined} imageUrl
 */
export function resolveAttachmentImage(imageUrl) {
  const v = String(imageUrl ?? '').trim()
  if (!v) return null
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v
  const base = String(API_BASE_URL || '').replace(/\/$/, '')
  if (!base) return v.startsWith('/') ? v : `/${v}`
  return v.startsWith('/') ? `${base}${v}` : `${base}/${v}`
}
