import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/** Lọc trạng thái voucher — giá trị API (PascalCase). */
export const VOUCHER_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "Inactive", label: "Tạm tắt" },
  { value: "Expired", label: "Hết hiệu lực" },
];

/** Loại giảm khi tạo voucher (theo API). */
export const VOUCHER_DISCOUNT_TYPE_OPTIONS = [
  { value: "Percentage", label: "Giảm theo phần trăm (%)" },
  { value: "FixedAmount", label: "Giảm số tiền cố định" },
];

/** Trạng thái khi tạo voucher. */
export const VOUCHER_CREATE_STATUS_OPTIONS = [
  { value: "Active", label: "Đang hoạt động" },
  { value: "Inactive", label: "Tạm tắt" },
  { value: "Expired", label: "Hết hiệu lực" },
];

/**
 * @typedef {object} AdminVoucherListItem
 * @property {number} id
 * @property {number} campaignId
 * @property {string} campaignName
 * @property {string} code
 * @property {string} discountType
 * @property {number} discountValue
 * @property {number} minOrderValue
 * @property {number | null} [maxDiscountAmount]
 * @property {number | null} [usageLimit]
 * @property {number} usedCount
 * @property {string} status
 */

/**
 * @typedef {object} AdminVoucherListResult
 * @property {AdminVoucherListItem[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 */

/**
 * @param {Record<string, string | number | undefined | null>} params
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
 * GET /api/admin/vouchers
 * @param {string} accessToken
 * @param {{ page?: number; pageSize?: number; status?: string }} [query]
 * @returns {Promise<AdminVoucherListResult>}
 */
export async function fetchAdminVouchers(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/vouchers${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminVoucherCreateBody
 * @property {number} campaignId
 * @property {string} code
 * @property {"Percentage" | "FixedAmount"} discountType
 * @property {number} discountValue
 * @property {number} minOrderValue
 * @property {number | null} [maxDiscountAmount]
 * @property {number | null} [usageLimit]
 * @property {string} [status]
 */

/**
 * POST /api/admin/vouchers
 * @param {string} accessToken
 * @param {AdminVoucherCreateBody} body
 */
export async function createAdminVoucher(accessToken, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl("/api/admin/vouchers"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      campaignId: body.campaignId,
      code: body.code,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderValue: body.minOrderValue,
      maxDiscountAmount: body.maxDiscountAmount ?? null,
      usageLimit: body.usageLimit ?? null,
      status: body.status,
    }),
  });

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/vouchers/:id
 * @param {string} accessToken
 * @param {number | string} voucherId
 * @param {AdminVoucherCreateBody} body
 * @returns {Promise<AdminVoucherListItem>}
 */
export async function updateAdminVoucher(accessToken, voucherId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(voucherId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID voucher không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/vouchers/${id}`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      campaignId: body.campaignId,
      code: body.code,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderValue: body.minOrderValue,
      maxDiscountAmount: body.maxDiscountAmount ?? null,
      usageLimit: body.usageLimit ?? null,
      status: body.status,
    }),
  });

  return parseApiEnvelope(res);
}
