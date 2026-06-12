import { apiUrl } from "@/config/api.config";
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

function pickRow(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/**
 * GET /api/store/products
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   search?: string;
 *   categoryId?: number;
 *   inStockOnly?: boolean;
 *   sort?: string;
 * }} [query]
 */
export async function fetchStoreProducts(query = {}) {
  const qs = buildQueryString({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    search: query.search?.trim() || undefined,
    categoryId: query.categoryId,
    inStockOnly: query.inStockOnly ? true : undefined,
    sort: query.sort || "name_asc",
  });

  const res = await fetch(apiUrl(`/api/store/products${qs}`), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await parseApiEnvelope(res);
  return {
    items: data?.items ?? data?.Items ?? [],
    totalCount: pickRow(data, "totalCount", "TotalCount") ?? 0,
    page: pickRow(data, "page", "Page") ?? 1,
    pageSize: pickRow(data, "pageSize", "PageSize") ?? 20,
  };
}

/**
 * GET /api/store/products/id/{id}
 * @param {number | string} productId
 */
export async function fetchStoreProductDetail(productId) {
  const id = String(productId).trim();
  const res = await fetch(apiUrl(`/api/store/products/id/${encodeURIComponent(id)}`), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return parseApiEnvelope(res);
}

/**
 * GET /api/store/variants/by-sku/{sku}
 * @param {string} sku
 */
export async function fetchStoreVariantBySku(sku) {
  const encoded = encodeURIComponent(String(sku || "").trim());
  if (!encoded) throw new Error("Nhập SKU để tra cứu.");
  const res = await fetch(apiUrl(`/api/store/variants/by-sku/${encoded}`), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return parseApiEnvelope(res);
}

export { pickRow as pickStoreRow };
