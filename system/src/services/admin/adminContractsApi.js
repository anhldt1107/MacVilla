import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

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
 * Chuẩn hóa phản hồi phân trang (camelCase / PascalCase).
 * @param {unknown} data
 * @returns {{ items: object[]; totalCount: number; page: number; pageSize: number }}
 */
export function normalizeAdminContractList(data) {
  if (!data || typeof data !== "object") {
    return { items: [], totalCount: 0, page: 1, pageSize: 20 };
  }
  const d = /** @type {Record<string, unknown>} */ (data);
  const items = /** @type {object[]} */ (d.items ?? d.Items ?? []);
  const totalCount = Number(d.totalCount ?? d.TotalCount ?? items.length) || 0;
  const page = Number(d.page ?? d.Page ?? 1) || 1;
  const pageSize = Number(d.pageSize ?? d.PageSize ?? 20) || 20;
  return { items, totalCount, page, pageSize };
}

/**
 * @typedef {object} AdminContractListItem
 * @property {number} id
 * @property {string} [contractNumber]
 * @property {string} [status]
 * @property {number} [quoteId]
 * @property {number} [customerId]
 * @property {string} [customerName]
 * @property {string} [createdAt]
 * @property {string | null} [validFrom]
 * @property {string | null} [validTo]
 */

/**
 * GET /api/admin/contracts
 * @param {string} accessToken
 * @param {{ page?: number; pageSize?: number; status?: string; customerId?: number; quoteId?: number }} [query]
 */
export async function fetchAdminContracts(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status || undefined,
    customerId: query.customerId,
    quoteId: query.quoteId,
  });
  const res = await fetch(apiUrl(`/api/admin/contracts${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  return normalizeAdminContractList(data);
}

/**
 * GET /api/admin/contracts/{id}
 * @param {string} accessToken
 * @param {string|number} contractId
 */
export async function fetchAdminContractDetail(accessToken, contractId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(contractId));
  const res = await fetch(apiUrl(`/api/admin/contracts/${id}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/contracts/by-number/{contractNumber}
 * @param {string} accessToken
 * @param {string} contractNumber
 */
export async function fetchAdminContractByNumber(accessToken, contractNumber) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const n = encodeURIComponent(String(contractNumber).trim());
  const res = await fetch(apiUrl(`/api/admin/contracts/by-number/${n}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/contracts
 * @param {string} accessToken
 * @param {{
 *   quoteId: number;
 *   sendForCustomerConfirmation: boolean;
 *   validFrom?: string | null;
 *   validTo?: string | null;
 *   paymentTerms?: string | null;
 *   attachmentUrl?: string | null;
 *   notes?: string | null;
 * }} body
 */
export async function createAdminContract(accessToken, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/contracts"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(body),
  });
  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/contracts/{id}
 * @param {string} accessToken
 * @param {string|number} contractId
 * @param {{
 *   validFrom?: string | null;
 *   validTo?: string | null;
 *   paymentTerms?: string | null;
 *   attachmentUrl?: string | null;
 *   notes?: string | null;
 * }} body
 */
export async function updateAdminContract(accessToken, contractId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(contractId));
  const res = await fetch(apiUrl(`/api/admin/contracts/${id}`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(body),
  });
  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/contracts/{id}/send-for-customer-confirmation
 * @param {string} accessToken
 * @param {string|number} contractId
 */
export async function sendAdminContractForCustomerConfirmation(accessToken, contractId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(contractId));
  const res = await fetch(apiUrl(`/api/admin/contracts/${id}/send-for-customer-confirmation`), {
    method: "PUT",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/contracts/{id}/cancel
 * @param {string} accessToken
 * @param {string|number} contractId
 * @param {{ reason?: string | null }} [body]
 */
export async function cancelAdminContract(accessToken, contractId, body = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(contractId));
  const res = await fetch(apiUrl(`/api/admin/contracts/${id}/cancel`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(body || {}),
  });
  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/contracts/statuses → mảng meta trạng thái (hình dạng BE có thể khác).
 * @param {string} accessToken
 * @returns {Promise<{ value: string; label: string }[]>}
 */
export async function fetchAdminContractStatuses(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/contracts/statuses"), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);

  if (Array.isArray(data)) {
    return data.map((x) => {
      if (typeof x === "string") return { value: x, label: x };
      const o = /** @type {Record<string, unknown>} */ (x);
      const value = String(o.value ?? o.code ?? o.name ?? o.status ?? "");
      const label = String(o.label ?? o.displayName ?? o.description ?? o.name ?? value);
      return { value, label };
    });
  }

  const d = /** @type {Record<string, unknown>} */ (data || {});
  const arr = /** @type {unknown[]} */ (d.statuses ?? d.items ?? d.Items ?? []);
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => {
    if (typeof x === "string") return { value: x, label: x };
    const o = /** @type {Record<string, unknown>} */ (x);
    const value = String(o.value ?? o.code ?? o.name ?? "");
    const label = String(o.label ?? o.displayName ?? o.description ?? o.name ?? value);
    return { value, label };
  });
}

const DEFAULT_STATUS_BADGE =
  "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";

/**
 * Badge theo trạng thái (một số giá trị phổ biến; còn lại dùng mặc định).
 * @param {string | undefined | null} status
 */
export function adminContractStatusBadgeClass(status) {
  const s = (status || "").trim();
  const u = s.toLowerCase().replace(/\s+/g, "");
  if (u.includes("draft")) {
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
  }
  if (u.includes("pending") && u.includes("confirm")) {
    return "bg-violet-50 text-violet-950 ring-1 ring-violet-200/90 dark:bg-violet-950/40 dark:text-violet-100 dark:ring-violet-800/50";
  }
  if (u.includes("confirm") && !u.includes("pending")) {
    return "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (u.includes("active")) {
    return "bg-teal-50 text-teal-950 ring-1 ring-teal-200/90 dark:bg-teal-950/40 dark:text-teal-100 dark:ring-teal-800/50";
  }
  if (u.includes("cancel")) {
    return "bg-red-50 text-red-950 ring-1 ring-red-200/90 dark:bg-red-950/40 dark:text-red-100 dark:ring-red-800/50";
  }
  return DEFAULT_STATUS_BADGE;
}

/**
 * Fallback tiếng Việt khi API `/statuses` trả về chỉ là mảng chuỗi (label = value).
 */
const CONTRACT_STATUS_LABEL_VI = {
  draft: "Nháp",
  pendingconfirmation: "Chờ khách xác nhận",
  confirmed: "Đã xác nhận",
  active: "Đang hiệu lực",
  expired: "Hết hạn",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  rejected: "Đã từ chối",
  terminated: "Đã chấm dứt",
};

/**
 * @param {string | undefined | null} status
 * @param {{ value: string; label: string }[]} [statusOptions]
 */
export function labelAdminContractStatus(status, statusOptions) {
  const raw = (status || "").trim();
  if (!raw) return "—";
  const hit = statusOptions?.find((o) => o.value === raw);
  if (hit && hit.label && hit.label !== hit.value) return hit.label;
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  return CONTRACT_STATUS_LABEL_VI[key] ?? hit?.label ?? raw;
}
