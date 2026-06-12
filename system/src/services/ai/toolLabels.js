/**
 * Map `toolName` → nhãn tiếng Việt cho chip toolsUsed.
 * Nguồn: ai_intergrate.md §10.3.
 */
const TOOL_LABELS = {
  get_revenue_overview: "Doanh thu tổng quan",
  get_revenue_timeseries: "Doanh thu theo thời gian",
  get_revenue_by_payment_method: "Theo phương thức thanh toán",
  get_revenue_by_channel: "B2C / B2B",
  get_ar_summary: "Công nợ tổng quan",
  get_ar_aging: "Tuổi nợ",
  get_ar_top_debtors: "Top khách nợ",
  get_ar_timeseries: "Công nợ theo thời gian",
  get_sales_funnel: "Phễu báo giá",
  get_quotes_expiring_soon: "Báo giá sắp hết hạn",
  get_inventory_overview: "Tồn kho tổng quan",
  get_inventory_low_stock: "Tồn thấp",
  get_inventory_days_of_cover: "Ngày tồn còn bán",
  get_inventory_top_moving: "SKU bán chạy",
  get_order_status_breakdown: "Trạng thái đơn",
  get_late_orders: "Đơn trễ",
  get_order_by_code: "Tra đơn",
  get_my_orders: "Đơn của tôi",
  get_my_order_by_code: "Đơn theo mã",
  get_my_order_timeline: "Tiến độ đơn",
  get_my_invoices: "Hóa đơn của tôi",
  get_my_invoice_by_number: "Hóa đơn theo số",
  get_my_debt_summary: "Công nợ của tôi",
  get_my_quotes: "Báo giá của tôi",
  get_my_quote_by_code: "Báo giá theo mã",
  search_products: "Tìm sản phẩm",
  get_categories: "Danh mục",
};

/** @param {string | null | undefined} name */
export function formatToolLabel(name) {
  if (!name) return "Tra cứu dữ liệu";
  return TOOL_LABELS[name] || name;
}

/** @param {number | null | undefined} ms */
export function formatLatency(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return "";
  const n = Number(ms);
  if (n < 1000) return `(${Math.round(n)}ms)`;
  return `(${(n / 1000).toFixed(1)}s)`;
}
