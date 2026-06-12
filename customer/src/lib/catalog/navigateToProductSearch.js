/**
 * Điều hướng tới /products với từ khóa tìm kiếm, giữ nguyên query khác khi đang ở trang sản phẩm.
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @param {import('react-router-dom').Location} location
 * @param {string} rawQuery
 */
export function navigateToProductSearch(navigate, location, rawQuery) {
  const q = String(rawQuery ?? '').trim()
  const params = new URLSearchParams(
    location.pathname === '/products' ? location.search : ''
  )
  if (q) {
    params.set('search', q)
  } else {
    params.delete('search')
  }
  params.delete('page')
  const qs = params.toString()
  navigate(qs ? `/products?${qs}` : '/products')
}
