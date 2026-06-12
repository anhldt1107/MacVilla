/** Giới hạn số SP trên thanh & trang so sánh */
export const MAX_COMPARE = 3

/** @param {URLSearchParams} sp */
export function parseCompareIdsFromSearchParams(sp) {
  const raw = sp.get('ids')
  if (raw == null || String(raw).trim() === '') return []
  try {
    const decoded = decodeURIComponent(String(raw).trim())
    const out = []
    const seen = new Set()
    for (const part of decoded.split(',')) {
      const id = Number.parseInt(part.trim(), 10)
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue
      seen.add(id)
      out.push(id)
      if (out.length >= MAX_COMPARE) break
    }
    return out
  } catch {
    return []
  }
}

/** @param {number[]} idsOrdered */
export function idsToCompareQuery(idsOrdered) {
  return idsOrdered.slice(0, MAX_COMPARE).join(',')
}

/**
 * @param {object | null | undefined} detail
 */
export function pickDefaultVariantForCompare(detail) {
  const list = Array.isArray(detail?.variants) ? detail.variants : []
  return list.find((v) => v && typeof v.id === 'number') ?? null
}
