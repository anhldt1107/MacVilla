import { ApiError, apiJson } from '../httpClient'

/**
 * @typedef {object} GoongAutocompletePrediction
 * @property {string} description
 * @property {string} placeId
 * @property {string} mainText
 * @property {string} secondaryText
 * @property {{ commune?: string, province?: string } | null} [compound]
 */

/**
 * Gợi ý địa chỉ qua BE proxy Goong.
 * Trả [] khi chưa cấu hình / lỗi mạng — form vẫn nhập tay được.
 *
 * @param {{ input: string, location?: string, limit?: number }} params
 * @returns {Promise<GoongAutocompletePrediction[]>}
 */
export async function fetchGoongAutocomplete({ input, location, limit }) {
  const q = String(input ?? '').trim()
  if (q.length < 3) return []

  const search = new URLSearchParams()
  search.set('input', q)
  if (location) search.set('location', location)
  if (limit != null && Number.isFinite(limit)) search.set('limit', String(limit))

  try {
    const res = await apiJson(`/api/store/geo/autocomplete?${search.toString()}`, {
      method: 'GET',
    })
    const data = res?.data
    if (!data || typeof data !== 'object') return []
    const preds = /** @type {{ predictions?: unknown[] }} */ (data).predictions
    if (!Array.isArray(preds)) return []
    return preds
      .filter((p) => p && typeof p === 'object')
      .map((p) => {
        const row = /** @type {Record<string, unknown>} */ (p)
        return {
          description: String(row.description ?? ''),
          placeId: String(row.placeId ?? row.place_id ?? ''),
          mainText: String(row.mainText ?? row.main_text ?? row.description ?? ''),
          secondaryText: String(row.secondaryText ?? row.secondary_text ?? ''),
          compound:
            row.compound && typeof row.compound === 'object'
              ? /** @type {{ commune?: string, province?: string }} */ (row.compound)
              : null,
        }
      })
      .filter((p) => p.description.trim() !== '')
  } catch (e) {
    if (e instanceof ApiError && (e.status === 503 || e.errorCode === 'GOONG_NOT_CONFIGURED')) {
      return []
    }
    return []
  }
}
