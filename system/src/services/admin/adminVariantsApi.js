import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/**
 * Query string PascalCase theo contract API (vd. `?Page=1&PageSize=50&Search=...`).
 * @param {{ Page?: number; PageSize?: number; Search?: string }} params
 */
function buildVariantsQueryString(params) {
  const q = new URLSearchParams();
  if (params.Page != null && params.Page !== "") q.set("Page", String(params.Page));
  if (params.PageSize != null && params.PageSize !== "") q.set("PageSize", String(params.PageSize));
  if (params.Search) q.set("Search", params.Search);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * @typedef {object} AdminVariantListItem
 * @property {number} id
 * @property {number} productId
 * @property {string} productName
 * @property {string} productStatus
 * @property {number} categoryId
 * @property {string} categoryName
 * @property {string} sku
 * @property {string} variantName
 * @property {number} retailPrice
 * @property {number} costPrice
 * @property {number | null} [weight]
 * @property {string | null} [imageUrl]
 * @property {number} quantityOnHand
 * @property {number} quantityReserved
 * @property {number} quantityAvailable
 */

/**
 * @typedef {object} AdminVariantListResult
 * @property {AdminVariantListItem[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 */

/**
 * GET /api/admin/variants
 * @param {string} accessToken
 * @param {{ page?: number; pageSize?: number; search?: string }} [query]
 * @returns {Promise<AdminVariantListResult>}
 */
export async function fetchAdminVariants(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const page = Number(query.page);
  const pageSize = Number(query.pageSize);
  const qs = buildVariantsQueryString({
    Page: Number.isFinite(page) && page > 0 ? page : 1,
    PageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 50,
    Search: query.search?.trim() || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/variants${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/variants/by-sku/{sku}
 * @param {string} accessToken
 * @param {string} sku
 */
export async function fetchAdminVariantBySku(accessToken, sku) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const trimmed = String(sku ?? "").trim();
  if (!trimmed) throw new Error("Nhập mã SKU.");
  const encoded = encodeURIComponent(trimmed).replace(/%2F/gi, "/");
  const res = await fetch(apiUrl(`/api/admin/variants/by-sku/${encoded}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}
