import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

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
 * GET /api/admin/warehouse/overview — `fe_tich_hop_ton_kho_reorder_api_doc.md` (W1).
 * @param {string} accessToken
 * @param {{ lowStockThreshold?: number }} [query]
 */
export async function fetchAdminWarehouseOverview(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qs = buildQueryString({
    lowStockThreshold: query.lowStockThreshold,
  });
  const res = await fetch(apiUrl(`/api/admin/warehouse/overview${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/warehouse/low-stock — W2.
 * @param {string} accessToken
 * @param {{ threshold?: number; take?: number }} [query]
 */
export async function fetchAdminWarehouseLowStock(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qs = buildQueryString({
    threshold: query.threshold,
    take: query.take,
  });
  const res = await fetch(apiUrl(`/api/admin/warehouse/low-stock${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/warehouse/inventory — W3 (phân trang).
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   search?: string;
 *   warehouseLocation?: string;
 *   onlyOutOfStock?: boolean;
 *   onlyBelowThreshold?: boolean;
 *   threshold?: number;
 * }} [query]
 */
export async function fetchAdminWarehouseInventoryPage(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search?.trim() || undefined,
    warehouseLocation: query.warehouseLocation?.trim() || undefined,
    onlyOutOfStock: query.onlyOutOfStock === true ? true : undefined,
    onlyBelowThreshold: query.onlyBelowThreshold === true ? true : undefined,
    threshold: query.threshold,
  });
  const res = await fetch(apiUrl(`/api/admin/warehouse/inventory${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}
