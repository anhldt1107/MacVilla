import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/**
 * Loại tham chiếu giao dịch kho (API) — mở rộng khi backend thêm giá trị.
 * @type {Record<string, string>}
 */
export const INVENTORY_REFERENCE_TYPE_LABELS = {
  purchaseorder: "Đơn mua (PO)",
  order: "Đơn hàng",
};

/** Loại giao dịch kho — giá trị API (UPPERCASE). */
export const INVENTORY_TRANSACTION_TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "IN", label: "Nhập kho" },
  { value: "OUT", label: "Xuất kho" },
  { value: "ADJUST", label: "Điều chỉnh" },
  { value: "RESERVE", label: "Giữ chỗ" },
  { value: "RELEASE", label: "Giải phóng giữ chỗ" },
];

/** Gửi form tạo giao dịch (POST) — không có mục «Tất cả». */
export const INVENTORY_TRANSACTION_TYPE_CREATE_OPTIONS = INVENTORY_TRANSACTION_TYPE_OPTIONS.filter((o) => o.value);

/** Loại tham chiếu khi tạo giao dịch (giá trị API). */
export const INVENTORY_REFERENCE_TYPE_OPTIONS = [
  { value: "PurchaseOrder", label: "Đơn mua (PurchaseOrder)" },
  { value: "Order", label: "Đơn hàng (Order)" },
];

/** Tạo giao dịch: tham chiếu có thể bỏ trống (`dev/.../giao-dich-kho.md`). */
export const INVENTORY_REFERENCE_TYPE_CREATE_OPTIONS = [
  { value: "", label: "Không có chứng từ tham chiếu" },
  ...INVENTORY_REFERENCE_TYPE_OPTIONS,
];

/**
 * @typedef {object} AdminInventoryTransactionItem
 * @property {number} id
 * @property {number} variantId
 * @property {string} [variantSku]
 * @property {string} [variantName]
 * @property {string} [productName]
 * @property {string} transactionType
 * @property {number} quantity
 * @property {string} [referenceType]
 * @property {string} [referenceId]
 * @property {string} timestamp
 */

/**
 * @typedef {object} AdminInventoryTransactionListResult
 * @property {AdminInventoryTransactionItem[]} items
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
 * Chuẩn hóa phân trang (camelCase / PascalCase).
 * @param {unknown} data
 * @returns {AdminInventoryTransactionListResult}
 */
export function normalizeInventoryTransactionList(data) {
  if (!data || typeof data !== "object") {
    return { items: [], totalCount: 0, page: 1, pageSize: 50 };
  }
  const d = /** @type {Record<string, unknown>} */ (data);
  const items = /** @type {AdminInventoryTransactionItem[]} */ (d.items ?? d.Items ?? []);
  const totalCount = Number(d.totalCount ?? d.TotalCount ?? 0) || 0;
  const page = Number(d.page ?? d.Page ?? 1) || 1;
  const pageSize = Number(d.pageSize ?? d.PageSize ?? 50) || 50;
  return { items, totalCount, page, pageSize };
}

/**
 * GET /api/admin/inventory-transactions
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   variantId?: string | number;
 *   type?: string;
 *   fromDate?: string;
 *   toDate?: string;
 * }} [query]
 * @returns {Promise<AdminInventoryTransactionListResult>}
 */
export async function fetchAdminInventoryTransactions(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    variantId:
      query.variantId !== undefined && query.variantId !== null && query.variantId !== ""
        ? query.variantId
        : undefined,
    type: query.type || undefined,
    fromDate: query.fromDate || undefined,
    toDate: query.toDate || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/inventory-transactions${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  const raw = await parseApiEnvelope(res);
  return normalizeInventoryTransactionList(raw);
}

/**
 * GET /api/admin/inventory-transactions/{id}
 * @param {string} accessToken
 * @param {string|number} transactionId
 */
export async function fetchAdminInventoryTransactionDetail(accessToken, transactionId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(transactionId));
  const res = await fetch(apiUrl(`/api/admin/inventory-transactions/${id}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });
  return parseApiEnvelope(res);
}

/**
 * Body POST tạo giao dịch kho.
 * @typedef {object} AdminInventoryTransactionCreatePayload
 * @property {number} variantId
 * @property {string} transactionType
 * @property {number} quantity
 * @property {string} referenceType
 * @property {string} [referenceId]
 * @property {string} [notes]
 */

/**
 * POST /api/admin/inventory-transactions
 * @param {string} accessToken
 * @param {AdminInventoryTransactionCreatePayload} payload
 * @returns {Promise<AdminInventoryTransactionItem & { notes?: string; workerIdAssigned?: number; workerName?: string; managerIdApproved?: number | null; managerName?: string | null }>}
 */
export async function createAdminInventoryTransaction(accessToken, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!payload || typeof payload !== "object") throw new Error("Payload giao dịch kho không hợp lệ.");

  const body = {
    variantId: payload.variantId,
    transactionType: payload.transactionType,
    quantity: payload.quantity,
  };
  const rt = (payload.referenceType != null ? String(payload.referenceType) : "").trim();
  const rid = (payload.referenceId != null ? String(payload.referenceId) : "").trim();
  if (rt) body.referenceType = rt;
  if (rid) body.referenceId = rid;
  const notesRaw = payload.notes != null ? String(payload.notes) : "";
  const notes = notesRaw.trim();
  if (notes) body.notes = notes.slice(0, 1000);

  const res = await fetch(apiUrl("/api/admin/inventory-transactions"), {
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
 * @param {string | undefined | null} code
 */
export function labelInventoryTransactionType(code) {
  const hit = INVENTORY_TRANSACTION_TYPE_OPTIONS.find((o) => o.value === code);
  return hit?.label ?? code ?? "—";
}

/**
 * @param {string | undefined | null} referenceType
 */
export function labelInventoryReferenceType(referenceType) {
  const raw = (referenceType || "").trim();
  if (!raw) return "—";
  const key = raw.replace(/\s+/g, "").toLowerCase();
  return INVENTORY_REFERENCE_TYPE_LABELS[key] ?? raw;
}

/**
 * @param {string | undefined | null} referenceType
 */
export function inventoryReferenceTypeBadgeClass(referenceType) {
  const key = (referenceType || "").replace(/\s+/g, "").toLowerCase();
  if (key === "purchaseorder") {
    return "bg-indigo-50 text-indigo-950 ring-1 ring-indigo-200/90 dark:bg-indigo-950/35 dark:text-indigo-100 dark:ring-indigo-800/50";
  }
  if (key === "order") {
    return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  }
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600";
}

/**
 * @param {string | undefined | null} type
 */
export function inventoryTransactionTypeBadgeClass(type) {
  const t = (type || "").toUpperCase();
  if (t === "IN") {
    return "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/90 dark:bg-emerald-950/35 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (t === "OUT") {
    return "bg-rose-50 text-rose-950 ring-1 ring-rose-200/90 dark:bg-rose-950/35 dark:text-rose-100 dark:ring-rose-800/50";
  }
  if (t === "ADJUST") {
    return "bg-violet-50 text-violet-950 ring-1 ring-violet-200/90 dark:bg-violet-950/35 dark:text-violet-100 dark:ring-violet-800/50";
  }
  if (t === "RESERVE") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  if (t === "RELEASE") {
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}
