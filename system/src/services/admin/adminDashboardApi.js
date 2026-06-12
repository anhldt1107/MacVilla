/**
 * GET `/api/admin/dashboard/...` — theo `dashboard-implement.md` (KPI + timeseries, read-only).
 * Policy: ManagerOrAdmin, WarehouseStaff, … tùy endpoint.
 */
import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

const BASE = "/api/admin/dashboard";

/**
 * @param {Record<string, string | number | boolean | undefined | null>} params
 */
function buildQueryString(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null || val === "") return;
    q.set(key, String(val));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * @param {string} accessToken
 * @param {string} path
 * @param {Record<string, string | number | boolean | undefined | null>} [query]
 */
async function getDashboard(accessToken, path, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qs = buildQueryString(query);
  const res = await fetch(apiUrl(`${BASE}${path}${qs}`), {
    method: "GET",
    headers: { Accept: "application/json", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

// --- Revenue (ManagerOrAdmin) ---

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string }} [query]
 */
export function fetchDashboardRevenueOverview(accessToken, query = {}) {
  return getDashboard(accessToken, "/revenue/overview", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; granularity?: "day" | "week" | "month" }} [query]
 */
export function fetchDashboardRevenueTimeseries(accessToken, query = {}) {
  return getDashboard(accessToken, "/revenue/timeseries", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string }} [query]
 */
export function fetchDashboardRevenueByPaymentMethod(accessToken, query = {}) {
  return getDashboard(accessToken, "/revenue/by-payment-method", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; granularity?: "day" | "week" | "month" }} [query]
 */
export function fetchDashboardRevenueByChannel(accessToken, query = {}) {
  return getDashboard(accessToken, "/revenue/by-channel", query);
}

// --- AR (ManagerOrAdmin) ---

export function fetchDashboardArSummary(accessToken, query = {}) {
  return getDashboard(accessToken, "/ar/summary", query);
}

export function fetchDashboardArAging(accessToken, query = {}) {
  return getDashboard(accessToken, "/ar/aging", query);
}

/**
 * @param {string} accessToken
 * @param {{ limit?: number }} [query]
 */
export function fetchDashboardArTopDebtors(accessToken, query = {}) {
  return getDashboard(accessToken, "/ar/top-debtors", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; granularity?: "day" | "week" | "month" }} [query]
 */
export function fetchDashboardArTimeseries(accessToken, query = {}) {
  return getDashboard(accessToken, "/ar/timeseries", query);
}

// --- Sales pipeline ---

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; salesId?: number }} [query]
 */
export function fetchDashboardSalesPipelineFunnel(accessToken, query = {}) {
  return getDashboard(accessToken, "/sales-pipeline/funnel", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; salesId?: number }} [query]
 */
export function fetchDashboardSalesPipelineConversion(accessToken, query = {}) {
  return getDashboard(accessToken, "/sales-pipeline/conversion", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; salesId?: number }} [query]
 */
export function fetchDashboardSalesPipelineTimeInStage(accessToken, query = {}) {
  return getDashboard(accessToken, "/sales-pipeline/time-in-stage", query);
}

/**
 * @param {string} accessToken
 * @param {{ days?: number; salesId?: number }} [query]
 */
export function fetchDashboardSalesPipelineExpiringSoon(accessToken, query = {}) {
  return getDashboard(accessToken, "/sales-pipeline/expiring-soon", query);
}

// --- Inventory (WarehouseStaff) ---

export function fetchDashboardInventoryOverview(accessToken, query = {}) {
  return getDashboard(accessToken, "/inventory/overview", query);
}

/**
 * @param {string} accessToken
 * @param {{ threshold?: number; take?: number; windowDays?: number }} [query]
 */
export function fetchDashboardInventoryLowStock(accessToken, query = {}) {
  return getDashboard(accessToken, "/inventory/low-stock", query);
}

/**
 * @param {string} accessToken
 * @param {{ windowDays?: number; take?: number }} [query]
 */
export function fetchDashboardInventoryDaysOfCover(accessToken, query = {}) {
  return getDashboard(accessToken, "/inventory/days-of-cover", query);
}

/**
 * @param {string} accessToken
 * @param {{ take?: number }} [query]
 */
export function fetchDashboardInventoryReserveRatio(accessToken, query = {}) {
  return getDashboard(accessToken, "/inventory/reserve-ratio", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; granularity?: "day" | "week" | "month" }} [query]
 */
export function fetchDashboardInventoryTransactionsTrend(accessToken, query = {}) {
  return getDashboard(accessToken, "/inventory/transactions-trend", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; limit?: number }} [query]
 */
export function fetchDashboardInventoryTopMoving(accessToken, query = {}) {
  return getDashboard(accessToken, "/inventory/top-moving", query);
}

// --- Operations (WarehouseStaff) ---

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string }} [query]
 */
export function fetchDashboardOperationsOrderStatusBreakdown(accessToken, query = {}) {
  return getDashboard(accessToken, "/operations/order-status-breakdown", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string }} [query]
 */
export function fetchDashboardOperationsFulfillmentStatus(accessToken, query = {}) {
  return getDashboard(accessToken, "/operations/fulfillment-status", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string }} [query]
 */
export function fetchDashboardOperationsSlaConfirmedToShipped(accessToken, query = {}) {
  return getDashboard(accessToken, "/operations/sla-confirmed-to-shipped", query);
}

/**
 * @param {string} accessToken
 * @param {{ slaHours?: number }} [query]
 */
export function fetchDashboardOperationsLateOrders(accessToken, query = {}) {
  return getDashboard(accessToken, "/operations/late-orders", query);
}

// --- Sales performance ---

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string; limit?: number }} [query]
 */
export function fetchDashboardSalesPerformanceTopSales(accessToken, query = {}) {
  return getDashboard(accessToken, "/sales-performance/top-sales", query);
}

/**
 * @param {string} accessToken
 * @param {{ salesId: number; fromDate?: string; toDate?: string }} query
 */
export function fetchDashboardSalesPerformancePerSalesDetail(accessToken, query) {
  return getDashboard(accessToken, "/sales-performance/per-sales-detail", query);
}

/**
 * @param {string} accessToken
 * @param {{ fromDate?: string; toDate?: string }} [query]
 */
export function fetchDashboardSalesPerformanceQuoteConversionBySales(accessToken, query = {}) {
  return getDashboard(accessToken, "/sales-performance/quote-conversion-by-sales", query);
}
