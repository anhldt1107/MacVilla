import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/** Lọc trạng thái tài khoản — giá trị gửi API (PascalCase). */
export const ADMIN_USER_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "Inactive", label: "Ngưng hoạt động" },
];

/**
 * @typedef {object} AdminUserRole
 * @property {number} id
 * @property {string} roleName
 * @property {string} [description]
 */

/**
 * @typedef {object} AdminUserListItem
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {string | null} email
 * @property {string | null} phone
 * @property {number} roleId
 * @property {string} roleName
 * @property {string} status
 * @property {string} createdAt
 * @property {string | null} updatedAt
 */

/**
 * @typedef {object} AdminUserListResult
 * @property {AdminUserListItem[]} items
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
 * GET /api/admin/users — query optional.
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   search?: string;
 *   roleId?: string | number;
 *   status?: string;
 * }} [query]
 * @returns {Promise<AdminUserListResult>}
 */
export async function fetchAdminUsers(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search?.trim() || undefined,
    roleId: query.roleId !== undefined && query.roleId !== null && query.roleId !== "" ? query.roleId : undefined,
    status: query.status || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/users${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminUserDetail
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {string | null} email
 * @property {string | null} phone
 * @property {number} roleId
 * @property {string} roleName
 * @property {string | null} [roleDescription]
 * @property {string} status
 * @property {string} createdAt
 * @property {string | null} updatedAt
 * @property {number} [ordersHandledCount]
 * @property {number} [quotesCreatedCount]
 */

/**
 * GET /api/admin/users/:id
 * @param {string} accessToken
 * @param {number | string} userId
 * @returns {Promise<AdminUserDetail>}
 */
export async function fetchAdminUserById(accessToken, userId) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(userId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID nhân sự không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/users/${id}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminUserUpdateBody
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {number} roleId
 */

/**
 * PUT /api/admin/users/:id
 * @param {string} accessToken
 * @param {number | string} userId
 * @param {AdminUserUpdateBody} body
 * @returns {Promise<AdminUserDetail>}
 */
export async function updateAdminUser(accessToken, userId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(userId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID nhân sự không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/users/${id}`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      roleId: body.roleId,
    }),
  });

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/users/:id/reset-password
 * @param {string} accessToken
 * @param {number | string} userId
 * @param {string} newPassword
 * @returns {Promise<AdminUserDetail>}
 */
export async function resetAdminUserPassword(accessToken, userId, newPassword) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(userId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID nhân sự không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/users/${id}/reset-password`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({ newPassword }),
  });

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/users/:id/status
 * @param {string} accessToken
 * @param {number | string} userId
 * @param {"Active" | "Inactive"} status
 * @returns {Promise<AdminUserDetail>}
 */
export async function updateAdminUserStatus(accessToken, userId, status) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(userId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID nhân sự không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/users/${id}/status`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({ status }),
  });

  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/users/roles
 * @param {string} accessToken
 * @returns {Promise<AdminUserRole[]>}
 */
export async function fetchAdminUserRoles(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl("/api/admin/users/roles"), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  const data = await parseApiEnvelope(res);
  return Array.isArray(data) ? data : [];
}

/**
 * @typedef {object} AdminUserCreateBody
 * @property {string} username
 * @property {string} password
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {number} roleId
 */

/**
 * POST /api/admin/users
 * @param {string} accessToken
 * @param {AdminUserCreateBody} body
 */
export async function createAdminUser(accessToken, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl("/api/admin/users"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      username: body.username,
      password: body.password,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      roleId: body.roleId,
    }),
  });

  return parseApiEnvelope(res);
}
