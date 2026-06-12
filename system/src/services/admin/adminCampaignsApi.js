import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/** Lọc trạng thái chiến dịch — giá trị API (PascalCase). */
export const CAMPAIGN_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Active", label: "Đang chạy" },
  { value: "Inactive", label: "Tạm dừng" },
  { value: "Expired", label: "Hết hạn" },
];

/** Trạng thái khi tạo mới (API không nhận Expired lúc tạo). */
export const CAMPAIGN_CREATE_STATUS_OPTIONS = [
  { value: "Active", label: "Đang chạy" },
  { value: "Inactive", label: "Tạm dừng" },
];

/** Trạng thái khi cập nhật (PUT — gồm cả Hết hạn). */
export const CAMPAIGN_UPDATE_STATUS_OPTIONS = CAMPAIGN_STATUS_OPTIONS.filter((o) => o.value !== "");

/**
 * @typedef {object} AdminCampaignListItem
 * @property {number} id
 * @property {string} name
 * @property {string | null} [description]
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} status
 * @property {number} [voucherCount]
 */

/**
 * @typedef {object} AdminCampaignListResult
 * @property {AdminCampaignListItem[]} items
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
 * GET /api/admin/campaigns
 * @param {string} accessToken
 * @param {{ page?: number; pageSize?: number; status?: string }} [query]
 * @returns {Promise<AdminCampaignListResult>}
 */
export async function fetchAdminCampaigns(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/campaigns${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminCampaignDetail
 * @property {number} id
 * @property {string} name
 * @property {string | null} [description]
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} status
 * @property {object[]} [vouchers]
 */

/**
 * GET /api/admin/campaigns/:id
 * @param {string} accessToken
 * @param {number | string} campaignId
 * @returns {Promise<AdminCampaignDetail>}
 */
export async function fetchAdminCampaignById(accessToken, campaignId) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(campaignId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID chiến dịch không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/campaigns/${id}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/campaigns/:id
 * @param {string} accessToken
 * @param {number | string} campaignId
 * @param {AdminCampaignCreateBody} body
 * @returns {Promise<AdminCampaignDetail>}
 */
export async function updateAdminCampaign(accessToken, campaignId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(campaignId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID chiến dịch không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/campaigns/${id}`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
    }),
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminCampaignCreateBody
 * @property {string} name
 * @property {string} description
 * @property {string} startDate ISO 8601
 * @property {string} endDate ISO 8601
 * @property {"Active" | "Inactive" | "Expired"} status
 */

/**
 * POST /api/admin/campaigns
 * @param {string} accessToken
 * @param {AdminCampaignCreateBody} body
 */
export async function createAdminCampaign(accessToken, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl("/api/admin/campaigns"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
    }),
  });

  return parseApiEnvelope(res);
}
