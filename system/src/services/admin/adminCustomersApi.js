import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

export const ADMIN_CUSTOMER_TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại khách" },
  { value: "B2C", label: "Khách lẻ (B2C)" },
  { value: "B2B", label: "Doanh nghiệp (B2B)" },
];

/** Rỗng = không gửi; true/false gửi lên query. */
export const ADMIN_CUSTOMER_DEBT_OPTIONS = [
  { value: "", label: "Tất cả công nợ" },
  { value: "false", label: "Không có công nợ" },
  { value: "true", label: "Đang có công nợ" },
];

/**
 * @typedef {object} AdminCustomerListItem
 * @property {number} id
 * @property {string} customerType
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string | null} companyName
 * @property {string | null} taxCode
 * @property {number} debtBalance
 * @property {number} orderCount
 * @property {number} totalSpent
 * @property {string} createdAt
 */

/**
 * @typedef {object} AdminCustomerListResult
 * @property {AdminCustomerListItem[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 */

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
 * GET /api/admin/customers — mọi query đều optional.
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   search?: string;
 *   customerType?: string;
 *   hasDebt?: string;
 * }} [query]
 * @returns {Promise<AdminCustomerListResult>}
 */
export async function fetchAdminCustomers(accessToken, query = {}) {
  if (!accessToken) {
    throw new Error("Chưa có access token.");
  }

  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search?.trim() || undefined,
    customerType: query.customerType || undefined,
    hasDebt: query.hasDebt === "true" || query.hasDebt === "false" ? query.hasDebt : undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/customers${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminCustomerAddress
 * @property {number} id
 * @property {string} receiverName
 * @property {string} receiverPhone
 * @property {string} addressLine
 * @property {boolean} isDefault
 */

/**
 * @typedef {object} AdminCustomerDetail
 * @property {number} id
 * @property {string} customerType
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string | null} companyName
 * @property {string | null} taxCode
 * @property {string | null} companyAddress
 * @property {number} debtBalance
 * @property {string} createdAt
 * @property {number} orderCount
 * @property {number} totalSpent
 * @property {string | null} lastOrderDate
 * @property {AdminCustomerAddress[]} addresses
 */

/**
 * GET /api/admin/customers/{id}
 * @param {string} accessToken
 * @param {number | string} customerId
 * @returns {Promise<AdminCustomerDetail>}
 */
export async function fetchAdminCustomerDetail(accessToken, customerId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = String(customerId).trim();
  if (!id) throw new Error("Thiếu mã khách hàng.");

  const res = await fetch(apiUrl(`/api/admin/customers/${encodeURIComponent(id)}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/customers/{id}/debt — công nợ B2B (Staff).
 * @param {string} accessToken
 * @param {number | string} customerId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchAdminCustomerDebt(accessToken, customerId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = String(customerId).trim();
  if (!id) throw new Error("Thiếu mã khách hàng.");

  const res = await fetch(apiUrl(`/api/admin/customers/${encodeURIComponent(id)}/debt`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/customers/{id}/debt/adjust — ManagerOrAdmin.
 * @param {string} accessToken
 * @param {number | string} customerId
 * @param {{ amount: number; reason: string; referenceCode?: string }} body
 */
export async function postAdminCustomerDebtAdjust(accessToken, customerId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = String(customerId).trim();
  if (!id) throw new Error("Thiếu mã khách hàng.");
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("Số tiền điều chỉnh không hợp lệ.");
  }
  const reason = String(body.reason ?? "").trim();
  if (!reason) throw new Error("Vui lòng nhập lý do điều chỉnh.");

  const payload = {
    amount,
    reason,
    ...(body.referenceCode != null && String(body.referenceCode).trim() !== ""
      ? { referenceCode: String(body.referenceCode).trim() }
      : {}),
  };

  const res = await fetch(apiUrl(`/api/admin/customers/${encodeURIComponent(id)}/debt/adjust`), {
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
