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
 * @param {unknown} data
 * @returns {{ items: object[]; totalCount: number; page: number; pageSize: number }}
 */
export function normalizeAdminTransferNotificationList(data) {
  if (!data || typeof data !== "object") {
    return { items: [], totalCount: 0, page: 1, pageSize: 20 };
  }
  const d = /** @type {Record<string, unknown>} */ (data);
  const items = /** @type {object[]} */ (d.items ?? d.Items ?? []);
  const totalCount = Number(d.totalCount ?? d.TotalCount ?? 0) || 0;
  const page = Number(d.page ?? d.Page ?? 1) || 1;
  const pageSize = Number(d.pageSize ?? d.PageSize ?? 20) || 20;
  return { items, totalCount, page, pageSize };
}

/**
 * GET /api/admin/transfer-notifications — `thong-bao-chuyen-khoan.md`.
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   status?: string;
 *   customerId?: string | number;
 *   fromDate?: string;
 *   toDate?: string;
 * }} [query]
 */
export async function fetchAdminTransferNotifications(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const cid = query.customerId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status?.trim() || undefined,
    customerId:
      cid !== undefined && cid !== null && String(cid).trim() !== "" && Number.isFinite(Number(cid)) && Number(cid) > 0
        ? Number(cid)
        : undefined,
    fromDate: query.fromDate?.trim() || undefined,
    toDate: query.toDate?.trim() || undefined,
  });
  const res = await fetch(apiUrl(`/api/admin/transfer-notifications${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return normalizeAdminTransferNotificationList(await parseApiEnvelope(res));
}

/**
 * GET /api/admin/transfer-notifications/statuses
 * @returns {Promise<string[]>}
 */
export async function fetchAdminTransferNotificationStatuses(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/transfer-notifications/statuses"), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  if (Array.isArray(data)) return /** @type {string[]} */ (data.filter((x) => typeof x === "string"));
  const d = /** @type {Record<string, unknown>} */ (data && typeof data === "object" ? data : {});
  const arr = /** @type {unknown[]} */ (d.statuses ?? d.Statuses ?? []);
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x)).filter(Boolean);
}

/**
 * GET /api/admin/transfer-notifications/{id}
 */
export async function fetchAdminTransferNotificationDetail(accessToken, notificationId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(notificationId ?? "").trim());
  if (!id) throw new Error("Thiếu mã thông báo.");
  const res = await fetch(apiUrl(`/api/admin/transfer-notifications/${id}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/transfer-notifications/{id}/verify
 * @param {string} accessToken
 * @param {number | string} notificationId
 * @param {{ processNote?: string }} [body]
 */
export async function verifyAdminTransferNotification(accessToken, notificationId, body = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(notificationId ?? "").trim());
  if (!id) throw new Error("Thiếu mã thông báo.");
  const res = await fetch(apiUrl(`/api/admin/transfer-notifications/${id}/verify`), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(body && typeof body === "object" ? body : {}),
  });
  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/transfer-notifications/{id}/reject
 * @param {string} accessToken
 * @param {number | string} notificationId
 * @param {{ reason: string }} body
 */
export async function rejectAdminTransferNotification(accessToken, notificationId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(notificationId ?? "").trim());
  if (!id) throw new Error("Thiếu mã thông báo.");
  const res = await fetch(apiUrl(`/api/admin/transfer-notifications/${id}/reject`), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(body && typeof body === "object" ? body : {}),
  });
  return parseApiEnvelope(res);
}

function normKey(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

const STATUS_LABEL_FALLBACK = {
  pending: "Chờ đối soát",
  verified: "Đã xác nhận",
  rejected: "Đã từ chối",
};

/**
 * @param {string | undefined | null} status
 */
export function labelAdminTransferNotificationStatus(status) {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const fb = STATUS_LABEL_FALLBACK[normKey(raw)];
  return fb ?? raw;
}

/**
 * @param {string | undefined | null} status
 */
export function transferNotificationStatusBadgeClass(status) {
  const k = normKey(status);
  if (k === "pending") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  if (k === "verified") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (k === "rejected") {
    return "bg-red-50 text-red-900 ring-1 ring-red-200/90 dark:bg-red-950/35 dark:text-red-100 dark:ring-red-800/50";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}
