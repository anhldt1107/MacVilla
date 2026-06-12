/**
 * Lỗi từ API envelope `{ success, message, errorCode }`.
 */
export class ApiRequestError extends Error {
  /**
   * @param {string} message
   * @param {string | null | undefined} errorCode
   * @param {unknown} [raw]
   * @param {number | undefined} [status] HTTP status (khi lỗi từ fetch)
   */
  constructor(message, errorCode, raw = undefined, status = undefined) {
    super(message);
    this.name = "ApiRequestError";
    this.errorCode = errorCode ?? null;
    this.raw = raw;
    /** @type {number | undefined} */
    this.status = status;
  }
}

/**
 * Đọc JSON và trả `data` khi `success === true`.
 * @param {Response} res
 */
export async function parseApiEnvelope(res) {
  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiRequestError("Không đọc được phản hồi từ máy chủ.", "PARSE_ERROR");
  }

  if (!res.ok || json.success !== true) {
    throw new ApiRequestError(
      json.message || `Lỗi HTTP ${res.status}`,
      json.errorCode ?? null,
      json,
      res.status
    );
  }

  return json.data;
}

/**
 * Lấy map field → message đầu tiên từ `errors` trong envelope lỗi.
 * @param {unknown} error
 * @returns {Record<string, string>}
 */
export function getEnvelopeFieldErrors(error) {
  if (!(error instanceof ApiRequestError)) return {};
  const raw = error.raw;
  if (!raw || typeof raw !== "object" || raw.errors == null || typeof raw.errors !== "object") return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, val] of Object.entries(raw.errors)) {
    if (Array.isArray(val) && val.length > 0) out[key] = String(val[0]);
    else if (typeof val === "string" && val) out[key] = val;
  }
  return out;
}
