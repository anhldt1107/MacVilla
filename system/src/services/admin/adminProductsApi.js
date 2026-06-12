import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/** Trạng thái sản phẩm — giá trị API. */
export const ADMIN_PRODUCT_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Active", label: "Đang bán" },
  { value: "Draft", label: "Bản nháp" },
  { value: "Hidden", label: "Ẩn" },
];

/**
 * @param {Record<string, string | number | boolean | undefined | null>} params
 */
function buildProductsQueryString(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null || val === "") return;
    if (typeof val === "boolean") {
      q.set(key, val ? "true" : "false");
      return;
    }
    q.set(key, String(val));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * @typedef {object} AdminProductListItem
 * @property {number} id
 * @property {number} categoryId
 * @property {string} [categoryName]
 * @property {string} name
 * @property {string} slug
 * @property {string | null} [imageUrl]
 * @property {number} basePrice
 * @property {number} [warrantyPeriodMonths]
 * @property {string} status
 * @property {number} [variantCount]
 * @property {number} [attributeCount]
 */

/**
 * @typedef {object} AdminProductListResult
 * @property {AdminProductListItem[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 */

/**
 * GET /api/admin/products
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   categoryId?: string | number;
 *   includeSubcategories?: boolean;
 *   status?: string;
 *   search?: string;
 * }} [query]
 * @returns {Promise<AdminProductListResult>}
 */
export async function fetchAdminProducts(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  /** @type {Record<string, string | number | boolean | undefined | null>} */
  const params = {
    page: query.page,
    pageSize: query.pageSize,
    status: query.status || undefined,
    search: query.search?.trim() || undefined,
  };

  const cid = query.categoryId;
  if (cid !== undefined && cid !== null && String(cid).trim() !== "") {
    const n = Number(cid);
    if (Number.isFinite(n) && n > 0) {
      params.categoryId = n;
      params.includeSubcategories = query.includeSubcategories !== false;
    }
  }

  const qs = buildProductsQueryString(params);

  const res = await fetch(apiUrl(`/api/admin/products${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminProductAttributeValue
 * @property {number} id
 * @property {string} value
 */

/**
 * @typedef {object} AdminProductAttributeGroup
 * @property {number} id
 * @property {string} name
 * @property {AdminProductAttributeValue[]} values
 */

/**
 * @typedef {object} AdminProductVariantDetail
 * @property {number} id
 * @property {number} [productId]
 * @property {string} [productName]
 * @property {string} sku
 * @property {string} variantName
 * @property {number} retailPrice
 * @property {number} costPrice
 * @property {number | null} [weight]
 * @property {string | null} [dimensions]
 * @property {string | null} [imageUrl]
 * @property {number} [quantityOnHand]
 * @property {number} [quantityReserved]
 * @property {number} [quantityAvailable]
 */

/**
 * @typedef {object} AdminProductDetail
 * @property {number} id
 * @property {number} categoryId
 * @property {string} [categoryName]
 * @property {string} name
 * @property {string} slug
 * @property {string | null} [description]
 * @property {string | null} [imageUrl]
 * @property {number} basePrice
 * @property {number} [warrantyPeriodMonths]
 * @property {string} status
 * @property {number} [variantCount]
 * @property {number} [attributeCount]
 * @property {AdminProductAttributeGroup[]} [attributes]
 * @property {AdminProductVariantDetail[]} [variants]
 */

/**
 * GET /api/admin/products/:id
 * @param {string} accessToken
 * @param {string | number} productId
 * @returns {Promise<AdminProductDetail>}
 */
export async function fetchAdminProductDetail(accessToken, productId) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = String(productId ?? "").trim();
  if (!id) throw new Error("Thiếu mã sản phẩm.");

  const res = await fetch(apiUrl(`/api/admin/products/${encodeURIComponent(id)}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/products/:productId/variants/:variantId
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {string | number} variantId
 * @returns {Promise<AdminProductVariantDetail>}
 */
export async function fetchAdminProductVariantDetail(accessToken, productId, variantId) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  const vid = String(variantId ?? "").trim();
  if (!pid || !vid) throw new Error("Thiếu mã sản phẩm hoặc biến thể.");

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants/${encodeURIComponent(vid)}`),
    {
      method: "GET",
      headers: {
        Accept: "*/*",
        ...bearerHeaders(accessToken),
      },
    }
  );

  return parseApiEnvelope(res);
}

/**
 * Body POST tạo sản phẩm.
 * @typedef {object} AdminProductCreatePayload
 * @property {number} categoryId
 * @property {string} name
 * @property {string} slug
 * @property {string} [description]
 * @property {string} [imageUrl]
 * @property {number} basePrice
 * @property {number} [warrantyPeriodMonths]
 * @property {string} status
 */

/**
 * POST /api/admin/products
 * @param {string} accessToken
 * @param {AdminProductCreatePayload} payload
 * @returns {Promise<AdminProductDetail>}
 */
export async function createAdminProduct(accessToken, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!payload || typeof payload !== "object") throw new Error("Payload sản phẩm không hợp lệ.");

  const res = await fetch(apiUrl("/api/admin/products"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

  return parseApiEnvelope(res);
}

/**
 * Body PUT cập nhật sản phẩm — khớp `ProductUpdateDto` (camelCase).
 * - Không gửi `imageUrl` khi giữ nguyên ảnh hiện có (BE coi field thiếu hoặc `null` là giữ).
 * - Gửi `imageUrl: ""` để xóa ảnh đại diện.
 * @typedef {object} AdminProductUpdatePayload
 * @property {number} categoryId
 * @property {string} name
 * @property {string} slug
 * @property {string | null} [description]
 * @property {string} [imageUrl]
 * @property {number | null} [basePrice]
 * @property {number} warrantyPeriodMonths
 * @property {string} status
 */

/**
 * PUT /api/admin/products/:id
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {AdminProductUpdatePayload} payload
 * @returns {Promise<AdminProductDetail>}
 */
export async function updateAdminProduct(accessToken, productId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  if (!pid) throw new Error("Thiếu mã sản phẩm.");

  if (!payload || typeof payload !== "object") throw new Error("Payload sản phẩm không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/products/${encodeURIComponent(pid)}`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

  return parseApiEnvelope(res);
}

/**
 * Body POST tạo biến thể.
 * @typedef {object} AdminProductVariantCreatePayload
 * @property {string} sku
 * @property {string} variantName
 * @property {number} retailPrice
 * @property {number} costPrice
 * @property {number} [weight]
 * @property {string} [dimensions]
 * @property {string} [imageUrl]
 */

/**
 * POST /api/admin/products/:productId/variants
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {AdminProductVariantCreatePayload} payload
 * @returns {Promise<AdminProductVariantDetail & { productId?: number; productName?: string }>}
 */
export async function createAdminProductVariant(accessToken, productId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  if (!pid) throw new Error("Thiếu mã sản phẩm.");

  if (!payload || typeof payload !== "object") {
    throw new Error("Payload biến thể không hợp lệ.");
  }

  const res = await fetch(apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants`), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/products/:productId/variants/:variantId
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {string | number} variantId
 * @param {AdminProductVariantCreatePayload} payload
 * @returns {Promise<AdminProductVariantDetail & { productId?: number; productName?: string }>}
 */
export async function updateAdminProductVariant(accessToken, productId, variantId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  const vid = String(variantId ?? "").trim();
  if (!pid || !vid) throw new Error("Thiếu mã sản phẩm hoặc biến thể.");

  if (!payload || typeof payload !== "object") {
    throw new Error("Payload biến thể không hợp lệ.");
  }

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants/${encodeURIComponent(vid)}`),
    {
      method: "PUT",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        ...bearerHeaders(accessToken),
      },
      body: JSON.stringify(payload),
    }
  );

  return parseApiEnvelope(res);
}

/**
 * DELETE /api/admin/products/:productId/variants/:variantId
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {string | number} variantId
 */
export async function deleteAdminProductVariant(accessToken, productId, variantId) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  const vid = String(variantId ?? "").trim();
  if (!pid || !vid) throw new Error("Thiếu mã sản phẩm hoặc biến thể.");

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants/${encodeURIComponent(vid)}`),
    {
      method: "DELETE",
      headers: {
        Accept: "*/*",
        ...bearerHeaders(accessToken),
      },
    }
  );

  return parseApiEnvelope(res);
}

/**
 * Tồn kho theo biến thể — `GET/PUT/POST .../variants/{id}/inventory` (`fe_tich_hop_ton_kho_reorder_api_doc.md`).
 * @typedef {object} AdminProductVariantInventory
 * @property {number} [id]
 * @property {number} [variantId]
 * @property {string | null} [warehouseLocation]
 * @property {number} quantityOnHand
 * @property {number} quantityReserved
 * @property {number} [quantityAvailable]
 * @property {number | null} [reorderPoint]
 * @property {number | null} [safetyStock]
 */

/**
 * GET /api/admin/products/:productId/variants/:variantId/inventory
 * @returns {Promise<AdminProductVariantInventory | null>} `null` nếu **404** (chưa khởi tạo).
 */
export async function fetchAdminProductVariantInventory(accessToken, productId, variantId) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  const vid = String(variantId ?? "").trim();
  if (!pid || !vid) throw new Error("Thiếu mã sản phẩm hoặc biến thể.");

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants/${encodeURIComponent(vid)}/inventory`),
    {
      method: "GET",
      headers: {
        Accept: "*/*",
        ...bearerHeaders(accessToken),
      },
    }
  );

  if (res.status === 404) return null;
  return parseApiEnvelope(res);
}

/**
 * Body PUT/POST tồn kho biến thể.
 * @typedef {object} AdminProductVariantInventoryPayload
 * @property {string} [warehouseLocation]
 * @property {number} quantityOnHand
 * @property {number} quantityReserved
 */

/**
 * PUT /api/admin/products/:productId/variants/:variantId/inventory — upsert (khuyến nghị).
 */
export async function upsertAdminProductVariantInventory(accessToken, productId, variantId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!payload || typeof payload !== "object") throw new Error("Payload tồn kho không hợp lệ.");

  const pid = String(productId ?? "").trim();
  const vid = String(variantId ?? "").trim();
  if (!pid || !vid) throw new Error("Thiếu mã sản phẩm hoặc biến thể.");

  const onHand = Number(payload.quantityOnHand);
  const reserved = Number(payload.quantityReserved);
  if (!Number.isFinite(onHand) || onHand < 0 || !Number.isInteger(onHand)) {
    throw new Error("Tồn thực tế phải là số nguyên ≥ 0.");
  }
  if (!Number.isFinite(reserved) || reserved < 0 || !Number.isInteger(reserved)) {
    throw new Error("Đang giữ phải là số nguyên ≥ 0.");
  }

  /** @type {Record<string, unknown>} */
  const body = {
    quantityOnHand: onHand,
    quantityReserved: reserved,
  };
  const loc = payload.warehouseLocation != null ? String(payload.warehouseLocation).trim() : "";
  if (loc) body.warehouseLocation = loc.slice(0, 500);

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants/${encodeURIComponent(vid)}/inventory`),
    {
      method: "PUT",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        ...bearerHeaders(accessToken),
      },
      body: JSON.stringify(body),
    }
  );

  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/products/:productId/variants/:variantId/inventory — tạo lần đầu (**409** nếu đã có).
 */
export async function createAdminProductVariantInventory(accessToken, productId, variantId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!payload || typeof payload !== "object") throw new Error("Payload tồn kho không hợp lệ.");

  const pid = String(productId ?? "").trim();
  const vid = String(variantId ?? "").trim();
  if (!pid || !vid) throw new Error("Thiếu mã sản phẩm hoặc biến thể.");

  const onHand = Number(payload.quantityOnHand);
  const reserved = Number(payload.quantityReserved);
  if (!Number.isFinite(onHand) || onHand < 0 || !Number.isInteger(onHand)) {
    throw new Error("Tồn thực tế phải là số nguyên ≥ 0.");
  }
  if (!Number.isFinite(reserved) || reserved < 0 || !Number.isInteger(reserved)) {
    throw new Error("Đang giữ phải là số nguyên ≥ 0.");
  }

  /** @type {Record<string, unknown>} */
  const body = {
    quantityOnHand: onHand,
    quantityReserved: reserved,
  };
  const loc = payload.warehouseLocation != null ? String(payload.warehouseLocation).trim() : "";
  if (loc) body.warehouseLocation = loc.slice(0, 500);

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants/${encodeURIComponent(vid)}/inventory`),
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        ...bearerHeaders(accessToken),
      },
      body: JSON.stringify(body),
    }
  );

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/products/:productId/variants/:variantId/inventory/reorder-policy — chỉnh `reorderPoint` / `safetyStock` (tách khỏi PUT tồn).
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {string | number} variantId
 * @param {{ reorderPoint: number | null; safetyStock: number | null }} body
 * @returns {Promise<AdminProductVariantInventory>}
 */
export async function updateAdminVariantInventoryReorderPolicy(accessToken, productId, variantId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const pid = String(productId ?? "").trim();
  const vid = String(variantId ?? "").trim();
  if (!pid || !vid) throw new Error("Thiếu mã sản phẩm hoặc biến thể.");

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/variants/${encodeURIComponent(vid)}/inventory/reorder-policy`),
    {
      method: "PUT",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        ...bearerHeaders(accessToken),
      },
      body: JSON.stringify({
        reorderPoint: body.reorderPoint === undefined ? null : body.reorderPoint,
        safetyStock: body.safetyStock === undefined ? null : body.safetyStock,
      }),
    }
  );

  return parseApiEnvelope(res);
}

/**
 * DELETE /api/admin/products/:productId/attributes/:attributeId
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {string | number} attributeId
 * @returns {Promise<null>}
 */
export async function deleteAdminProductAttribute(accessToken, productId, attributeId) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  const aid = String(attributeId ?? "").trim();
  if (!pid || !aid) throw new Error("Thiếu mã sản phẩm hoặc thuộc tính.");

  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/attributes/${encodeURIComponent(aid)}`),
    {
      method: "DELETE",
      headers: {
        Accept: "*/*",
        ...bearerHeaders(accessToken),
      },
    }
  );

  return parseApiEnvelope(res);
}

/**
 * Phản hồi PUT bulk-upsert (đủ dùng cho state `attributes` trên chi tiết SP).
 * @typedef {object} AdminProductAttributeBulkItem
 * @property {number} id
 * @property {number} [productId]
 * @property {string} name
 * @property {AdminProductAttributeValue[]} values
 */

/**
 * PUT /api/admin/products/:productId/attributes/bulk-upsert
 * Body: `{ "Tên thuộc tính": ["giá trị 1", ...], ... }`
 * @param {string} accessToken
 * @param {string | number} productId
 * @param {Record<string, string[]>} payload
 * @returns {Promise<AdminProductAttributeBulkItem[]>}
 */
export async function bulkUpsertAdminProductAttributes(accessToken, productId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const pid = String(productId ?? "").trim();
  if (!pid) throw new Error("Thiếu mã sản phẩm.");

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload thuộc tính không hợp lệ.");
  }

  const res = await fetch(apiUrl(`/api/admin/products/${encodeURIComponent(pid)}/attributes/bulk-upsert`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

  return parseApiEnvelope(res);
}

/**
 * @param {string | undefined | null} status
 */
export function labelAdminProductStatus(status) {
  const hit = ADMIN_PRODUCT_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status ?? "—";
}

/**
 * @param {string | undefined | null} status
 */
export function adminProductStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "active") {
    return "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/90 dark:bg-emerald-950/35 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (s === "draft") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  if (s === "hidden") {
    return "bg-slate-200/80 text-slate-800 ring-1 ring-slate-300/90 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}
