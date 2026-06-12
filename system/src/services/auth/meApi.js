import { apiUrl } from "@/config/api.config";
import { AuthApiError } from "./loginApi";

/**
 * Phản hồi `GET /api/me` — `data` theo `dev/req.md` (StaffMeDto, camelCase).
 * @typedef {object} StaffMeDto
 * @property {string} principalKind
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {string | null} [email]
 * @property {string | null} [phone]
 * @property {string} status
 * @property {number} roleId
 * @property {string} roleName
 * @property {string | null} [roleDescription]
 * @property {string | null} [permissions]
 * @property {boolean} [canAccessWarehouse]
 */

/**
 * User trong AuthContext (mở rộng so với payload login tối thiểu).
 * @typedef {object} AuthSessionUser
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {string} roleName
 * @property {string | null | undefined} email
 * @property {string | null | undefined} phone
 * @property {string | undefined} status
 * @property {number | undefined} roleId
 * @property {string | null | undefined} roleDescription
 * @property {string | null | undefined} permissions
 * @property {boolean} canAccessWarehouse
 * @property {string | undefined} principalKind
 */

/**
 * @param {StaffMeDto} me
 * @returns {AuthSessionUser}
 */
export function mapStaffMeToUser(me) {
  return {
    id: me.id,
    username: me.username,
    fullName: me.fullName ?? "",
    roleName: me.roleName,
    email: me.email ?? null,
    phone: me.phone ?? null,
    status: me.status,
    roleId: me.roleId,
    roleDescription: me.roleDescription ?? null,
    permissions: me.permissions ?? null,
    canAccessWarehouse: Boolean(me.canAccessWarehouse),
    principalKind: me.principalKind,
  };
}

/**
 * @typedef {object} MeApiEnvelope
 * @property {boolean} success
 * @property {string} [message]
 * @property {string | null} [errorCode]
 * @property {StaffMeDto} [data]
 */

/**
 * `GET /api/me` — Bearer staff token (`dev/req.md`).
 * @param {string} accessToken
 * @param {AbortSignal} [signal]
 * @returns {Promise<StaffMeDto>}
 */
export async function fetchStaffMe(accessToken, signal) {
  const res = await fetch(apiUrl("/api/me"), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  /** @type {MeApiEnvelope} */
  let json;
  try {
    json = await res.json();
  } catch {
    throw new AuthApiError("Không đọc được phản hồi từ máy chủ.", "PARSE_ERROR", null, res.status);
  }

  if (res.status === 401 || res.status === 403) {
    throw new AuthApiError(
      json.message || "Phiên đăng nhập không hợp lệ.",
      json.errorCode ?? "UNAUTHORIZED",
      json,
      res.status
    );
  }

  if (!json.success || !json.data) {
    throw new AuthApiError(
      json.message || "Không lấy được thông tin tài khoản.",
      json.errorCode ?? null,
      json,
      res.status
    );
  }

  return json.data;
}
