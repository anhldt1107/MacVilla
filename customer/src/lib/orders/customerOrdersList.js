/**
 * Chuẩn hoá payload danh sách đơn từ GET /api/store/me/orders.
 * @param {unknown} raw
 * @returns {{ items: unknown[], totalCount: number }}
 */
export function normalizeOrdersList(raw) {
  if (raw == null) return { items: [], totalCount: 0 }
  if (Array.isArray(raw)) return { items: raw, totalCount: raw.length }
  const o = /** @type {Record<string, unknown>} */ (raw)
  const items = Array.isArray(o.items) ? o.items : []
  const totalCount =
    typeof o.totalCount === 'number'
      ? o.totalCount
      : typeof o.total === 'number'
        ? o.total
        : items.length
  return { items, totalCount }
}

/**
 * @param {Record<string, unknown>} row
 * @returns {unknown}
 */
export function pickPayable(row) {
  if (row.payableTotal != null) return row.payableTotal
  if (row.totalAmount != null) return row.totalAmount
  if (row.payableAmount != null) return row.payableAmount
  return null
}
