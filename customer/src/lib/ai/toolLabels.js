/**
 * Map `toolName` → nhãn tiếng Việt cho chip toolsUsed (subset cho khách).
 * Nguồn: ai_intergrate.md §10.3 + bổ sung tool catalog/chính sách.
 */
const TOOL_LABELS = {
  get_my_orders: 'Đơn của tôi',
  get_my_order_by_code: 'Đơn theo mã',
  get_my_order_timeline: 'Tiến độ đơn',
  get_my_invoices: 'Hóa đơn của tôi',
  get_my_invoice_by_number: 'Hóa đơn theo số',
  get_my_debt_summary: 'Công nợ của tôi',
  get_my_quotes: 'Báo giá của tôi',
  get_my_quote_by_code: 'Báo giá theo mã',
  search_products: 'Tìm sản phẩm',
  get_categories: 'Danh mục',
  get_product_detail: 'Chi tiết SP',
  get_store_policy: 'Chính sách cửa hàng',
}

/** @param {string | null | undefined} name */
export function formatToolLabel(name) {
  if (!name) return 'Tra cứu dữ liệu'
  return TOOL_LABELS[name] || name
}

/** @param {number | null | undefined} ms */
export function formatLatency(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return ''
  const n = Number(ms)
  if (n < 1000) return `(${Math.round(n)}ms)`
  return `(${(n / 1000).toFixed(1)}s)`
}
