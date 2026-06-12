/**
 * Bộ lọc danh sách sản phẩm (B2C).
 * Thương hiệu / loại / năng lượng: giữ export để tái sử dụng sau khi có API; UI hiện ẩn.
 */

/** @typedef {{ id: string, label: string, defaultChecked?: boolean }} BrandOption */

/** @typedef {{ id: string, label: string, minPrice: number | null, maxPrice: number | null }} PriceBandOption */

/** Thứ tự đầu tiên là "Tất cả" — xóa minPrice/maxPrice trên URL. */
export const FILTER_PRICE_RANGES = /** @type {PriceBandOption[]} */ ([
  { id: 'all', label: 'Tất cả mức giá', minPrice: null, maxPrice: null },
  { id: 'under5m', label: 'Dưới 5 triệu', minPrice: 0, maxPrice: 5_000_000 },
  { id: '5m-15m', label: '5 – 15 triệu', minPrice: 5_000_000, maxPrice: 15_000_000 },
  { id: '15m-30m', label: '15 – 30 triệu', minPrice: 15_000_000, maxPrice: 30_000_000 },
  {
    id: 'over30m',
    label: 'Trên 30 triệu',
    minPrice: 30_000_000,
    maxPrice: null,
  },
])

/**
 * @param {number | null | undefined} minPrice
 * @param {number | null | undefined} maxPrice
 * @returns {string} id dải giá khớp URL, hoặc 'custom' nếu không khớp preset
 */
export function findPriceBandIdFromUrl(minPrice, maxPrice) {
  const min = minPrice == null ? null : Number(minPrice)
  const max = maxPrice == null ? null : Number(maxPrice)
  if (min == null && max == null) return 'all'
  for (const opt of FILTER_PRICE_RANGES) {
    if (opt.id === 'all') continue
    if (opt.minPrice === min && opt.maxPrice === max) {
      return opt.id
    }
  }
  return 'custom'
}

export const FILTER_BRANDS = [
  { id: 'macvilla', label: 'Macvilla', defaultChecked: true },
  { id: 'bosch', label: 'Bosch Cao cấp' },
  { id: 'samsung', label: 'Samsung Gia đình' },
  { id: 'lg', label: 'LG Nhà bếp' },
]

export const FILTER_APPLIANCE_TYPES = [
  { id: 'fridges', label: 'Tủ lạnh thông minh' },
  { id: 'induction', label: 'Bếp từ' },
  { id: 'steam', label: 'Lò hơi nước' },
]

export const FILTER_ENERGY = [
  { id: 'a+++', label: 'Tiết kiệm điện A+++' },
  { id: 'energystar', label: 'Energy Star' },
]
