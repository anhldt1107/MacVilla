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
export function normalizeAdminInvoiceList(data) {
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
 * GET /api/admin/invoices/statuses
 * @param {string} accessToken
 * @returns {Promise<{ value: string; label: string }[]>}
 */
export async function fetchAdminInvoiceStatuses(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/invoices/statuses"), {
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

/**
 * GET /api/admin/invoices
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   status?: string;
 *   customerId?: string | number;
 *   orderId?: string | number;
 *   fromDueDate?: string;
 *   toDueDate?: string;
 *   fromIssueDate?: string;
 *   toIssueDate?: string;
 *   search?: string;
 * }} [query]
 */
export async function fetchAdminInvoices(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const cid = query.customerId;
  const oid = query.orderId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status || undefined,
    customerId:
      cid !== undefined && cid !== null && String(cid).trim() !== "" && Number.isFinite(Number(cid)) && Number(cid) > 0
        ? Number(cid)
        : undefined,
    orderId:
      oid !== undefined && oid !== null && String(oid).trim() !== "" && Number.isFinite(Number(oid)) && Number(oid) > 0
        ? Number(oid)
        : undefined,
    fromDueDate: query.fromDueDate?.trim() || undefined,
    toDueDate: query.toDueDate?.trim() || undefined,
    fromIssueDate: query.fromIssueDate?.trim() || undefined,
    toIssueDate: query.toIssueDate?.trim() || undefined,
    search: query.search?.trim() || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/invoices${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const raw = await parseApiEnvelope(res);
  return normalizeAdminInvoiceList(raw);
}

/**
 * GET /api/admin/invoices/{id}
 */
export async function fetchAdminInvoiceDetail(accessToken, invoiceId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(invoiceId ?? "").trim());
  if (!id) throw new Error("Thiếu mã hóa đơn.");
  const res = await fetch(apiUrl(`/api/admin/invoices/${id}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/invoices/by-number/{invoiceNumber}
 */
export async function fetchAdminInvoiceByNumber(accessToken, invoiceNumber) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const n = encodeURIComponent(String(invoiceNumber ?? "").trim());
  if (!n) throw new Error("Thiếu số hóa đơn.");
  const res = await fetch(apiUrl(`/api/admin/invoices/by-number/${n}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminInvoiceCreatePayload
 * @property {number} customerId
 * @property {number} [orderId]
 * @property {number} [contractId]
 * @property {string} [taxCode]
 * @property {string} [companyName]
 * @property {string} [billingAddress]
 * @property {number} subTotal
 * @property {number} [taxAmount]
 * @property {string} [dueDate]
 */

/**
 * POST /api/admin/invoices
 */
export async function createAdminInvoice(accessToken, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!payload || typeof payload !== "object") throw new Error("Payload hóa đơn không hợp lệ.");
  const res = await fetch(apiUrl("/api/admin/invoices"), {
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
 * @typedef {object} AdminInvoiceUpdatePayload
 * @property {string} [taxCode]
 * @property {string} [companyName]
 * @property {string} [billingAddress]
 * @property {string} [dueDate]
 * @property {string} [pdfUrl]
 */

/**
 * PUT /api/admin/invoices/{id}
 */
export async function updateAdminInvoice(accessToken, invoiceId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(invoiceId ?? "").trim());
  if (!id) throw new Error("Thiếu mã hóa đơn.");
  const res = await fetch(apiUrl(`/api/admin/invoices/${id}`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify(payload && typeof payload === "object" ? payload : {}),
  });
  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/invoices/{id}/cancel
 * @param {string} [reason]
 */
export async function cancelAdminInvoice(accessToken, invoiceId, reason) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(invoiceId ?? "").trim());
  if (!id) throw new Error("Thiếu mã hóa đơn.");
  const body = {};
  const r = reason != null ? String(reason).trim() : "";
  if (r) body.reason = r;
  const res = await fetch(apiUrl(`/api/admin/invoices/${id}/cancel`), {
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

const DEFAULT_STATUS_BADGE =
  "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";

/** Nhãn khi BE không trả mô tả trong `/invoices/statuses` (chuẩn hóa key: bỏ khoảng trắng, chữ thường). */
const INVOICE_STATUS_LABEL_FALLBACK = {
  draft: "Bản nháp",
  unpaid: "Chưa thanh toán",
  sent: "Đã gửi",
  issued: "Đã phát hành",
  partiallypaid: "Thanh toán một phần",
  partialpaid: "Thanh toán một phần",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  void: "Vô hiệu",
  voided: "Vô hiệu",
};

/**
 * @param {string | undefined | null} status
 */
export function invoiceStatusBadgeClass(status) {
  const s = (status || "").replace(/\s+/g, "").toLowerCase();
  if (s === "draft") return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  if (s === "unpaid" || s === "sent" || s === "issued")
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  if (s === "partiallypaid" || s === "partialpaid")
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
  if (s === "paid") return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  if (s === "overdue")
    return "bg-rose-50 text-rose-950 ring-1 ring-rose-200/90 dark:bg-rose-950/35 dark:text-rose-100 dark:ring-rose-800/50";
  if (s === "cancelled" || s === "canceled" || s === "void" || s === "voided")
    return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600";
  return DEFAULT_STATUS_BADGE;
}

/** Trạng thái cho phép PUT thông tin xuất VAT (`hoa-don.md`). */
export function isAdminInvoiceVatEditable(status) {
  const s = (status || "").replace(/\s+/g, "").toLowerCase();
  return s === "draft" || s === "unpaid";
}

/** Trạng thái có thể thử hủy (UI — BE vẫn validate). */
export function canRequestAdminInvoiceCancel(status) {
  const s = (status || "").replace(/\s+/g, "").toLowerCase();
  return s !== "cancelled" && s !== "canceled" && s !== "void" && s !== "voided";
}

function normStatusKey(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * @param {string | undefined | null} status
 * @param {{ value: string; label: string }[]} [statusOptions]
 */
export function labelAdminInvoiceStatus(status, statusOptions) {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const key = normStatusKey(raw);
  const fb = INVOICE_STATUS_LABEL_FALLBACK[key];
  const hit = statusOptions?.find((o) => {
    const v = String(o?.value ?? "").trim();
    return v === raw || normStatusKey(v) === key;
  });
  if (fb) {
    const apiLabel = hit != null ? String(hit.label ?? "").trim() : "";
    const apiVal = hit != null ? String(hit.value ?? raw).trim() : "";
    const labelLooksUntranslated =
      !apiLabel || apiLabel === apiVal || normStatusKey(apiLabel) === normStatusKey(apiVal) || normStatusKey(apiLabel) === key;
    if (!hit || labelLooksUntranslated) return fb;
    return apiLabel;
  }
  if (hit?.label != null && String(hit.label).trim() !== "") return String(hit.label).trim();
  return raw;
}
