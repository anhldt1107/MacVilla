import { apiUrl } from "@/config/api.config";

/**
 * @typedef {object} AuthUserDto
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {string} roleName
 */

/**
 * @typedef {object} LoginSuccessData
 * @property {string} accessToken
 * @property {string} expiresAtUtc
 * @property {AuthUserDto} user
 */

export class AuthApiError extends Error {
  /**
   * @param {string} message
   * @param {string | null} [errorCode]
   * @param {unknown} [raw]
   * @param {number | null} [httpStatus]
   */
  constructor(message, errorCode = null, raw = null, httpStatus = null) {
    super(message);
    this.name = "AuthApiError";
    this.errorCode = errorCode;
    this.raw = raw;
    /** Mã HTTP khi có (vd. 401 từ `/api/me`) */
    this.httpStatus = httpStatus;
  }
}

/**
 * API base response envelope (luôn có success + message).
 * @typedef {object} ApiEnvelope
 * @property {boolean} success
 * @property {string} [message]
 * @property {string | null} [errorCode]
 * @property {LoginSuccessData} [data]
 */

/**
 * @param {{ username: string; password: string }} credentials
 * @returns {Promise<LoginSuccessData>}
 */
export async function loginRequest({ username, password }) {
  const res = await fetch(apiUrl("/api/Auth/login"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  /** @type {ApiEnvelope} */
  let json;
  try {
    json = await res.json();
  } catch {
    throw new AuthApiError("Không đọc được phản hồi từ máy chủ.", "PARSE_ERROR");
  }

  if (!json.success) {
    throw new AuthApiError(
      json.message || "Đăng nhập thất bại.",
      json.errorCode ?? null,
      json
    );
  }

  if (!json.data?.accessToken || !json.data?.user) {
    throw new AuthApiError("Phản hồi đăng nhập không hợp lệ.", "INVALID_PAYLOAD", json);
  }

  return json.data;
}
