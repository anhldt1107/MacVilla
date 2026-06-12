/**
 * Khớp BE `StoreCatalogSort` / query `sort`.
 */
export const STORE_SORT_DEFAULT = 'name_asc'

/** @typedef {{ id: string, label: string }} StoreSortOption */
/** @type {StoreSortOption[]} */
export const STORE_SORT_OPTIONS = [
  { id: 'name_asc', label: 'Tên A–Z' },
  { id: 'name_desc', label: 'Tên Z–A' },
  { id: 'price_asc', label: 'Giá thấp đến cao' },
  { id: 'price_desc', label: 'Giá cao đến thấp' },
]

const ALLOWED_SORT = new Set(STORE_SORT_OPTIONS.map((o) => o.id))

/** @param {string | null} raw */
export function normalizeStoreSort(raw) {
  if (!raw || !ALLOWED_SORT.has(raw)) return STORE_SORT_DEFAULT
  return raw
}
