import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/** Lọc trạng thái phiếu công việc — giá trị API (PascalCase). Luồng: Pending → Picking → Packed → Shipped. */
export const FULFILLMENT_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Chờ xử lý" },
  { value: "Picking", label: "Đang soạn hàng" },
  { value: "Packed", label: "Đã đóng gói" },
  { value: "Shipped", label: "Đã xuất kho" },
  { value: "Cancelled", label: "Đã hủy" },
];

/** Thứ tự bước trên timeline / form cập nhật (không gồm “tất cả”). */
export const FULFILLMENT_STATUS_FLOW = ["Pending", "Picking", "Packed", "Shipped"];

/**
 * Hình thức giao — cố định lúc tạo phiếu, không trùng luồng trạng thái (Pending → Picking → Packed → Shipped).
 * Chỉ dùng 2 lựa chọn để tránh nhầm với bước xử lý kho.
 */
export const FULFILLMENT_TICKET_TYPE_OPTIONS = [
  { value: "Standard", label: "Giao tận nơi" },
  { value: "Pickup", label: "Khách tự lấy" },
];

export const DEFAULT_FULFILLMENT_TICKET_TYPE = "Standard";

/**
 * @param {string | undefined | null} status
 * @returns {number} chỉ số trong FULFILLMENT_STATUS_FLOW, hoặc -1 nếu không khớp
 */
export function getFulfillmentStatusFlowIndex(status) {
  const i = FULFILLMENT_STATUS_FLOW.indexOf(status || "");
  return i;
}

/**
 * @typedef {object} AdminFulfillmentListItem
 * @property {number} id
 * @property {number} orderId
 * @property {string} orderCode
 * @property {string} ticketType
 * @property {string} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number | null} [assignedWorkerId]
 * @property {string | null} [assignedWorkerName]
 * @property {number} [createdBy]
 * @property {string | null} [createdByName]
 * @property {string | null} [customerName]
 * @property {string | null} [customerPhone]
 */

/**
 * @typedef {object} AdminFulfillmentListResult
 * @property {AdminFulfillmentListItem[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 */

/**
 * Payload PUT /status (theo API).
 * @typedef {object} AdminFulfillmentStatusUpdateBody
 * @property {string} status
 * @property {string} [notes]
 */

/**
 * Phản hồi chi tiết sau cập nhật trạng thái (có nested order).
 * @typedef {object} AdminFulfillmentStatusUpdateData
 * @property {number} id
 * @property {number} orderId
 * @property {string} ticketType
 * @property {string} status
 * @property {string} [notes]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number | null} [assignedWorkerId]
 * @property {string | null} [assignedWorkerName]
 * @property {number} [createdBy]
 * @property {string | null} [createdByName]
 * @property {{ orderCode?: string; customer?: { fullName?: string; phone?: string } }} [order]
 */

/**
 * Gộp dữ liệu API sau PUT vào dòng danh sách GET.
 * @param {AdminFulfillmentStatusUpdateData} data
 * @param {AdminFulfillmentListItem | null} [fallback]
 * @returns {AdminFulfillmentListItem}
 */
export function fulfillmentDetailToListItem(data, fallback = null) {
  const order = data.order;
  return {
    id: data.id,
    orderId: data.orderId,
    orderCode: order?.orderCode ?? fallback?.orderCode ?? "",
    ticketType: data.ticketType ?? fallback?.ticketType ?? "",
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    assignedWorkerId: data.assignedWorkerId ?? fallback?.assignedWorkerId,
    assignedWorkerName: data.assignedWorkerName ?? fallback?.assignedWorkerName,
    createdBy: data.createdBy ?? fallback?.createdBy,
    createdByName: data.createdByName ?? fallback?.createdByName,
    customerName: order?.customer?.fullName ?? fallback?.customerName ?? null,
    customerPhone: order?.customer?.phone ?? fallback?.customerPhone ?? null,
  };
}

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
 * GET /api/admin/fulfillments/statuses — danh sách trạng thái (enum) từ BE.
 * @param {string} accessToken
 * @returns {Promise<string[]>}
 */
export async function fetchAdminFulfillmentStatuses(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl("/api/admin/fulfillments/statuses"), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  const data = await parseApiEnvelope(res);
  if (Array.isArray(data)) return /** @type {string[]} */ (data.filter((x) => typeof x === "string"));
  if (data && typeof data === "object") {
    const d = /** @type {Record<string, unknown>} */ (data);
    const arr = d.statuses ?? d.items ?? d.values;
    if (Array.isArray(arr)) return /** @type {string[]} */ (arr.filter((x) => typeof x === "string"));
  }
  return [];
}

/**
 * GET /api/admin/fulfillments/:id — chi tiết phiếu + đơn (nested).
 * @param {string} accessToken
 * @param {number | string} fulfillmentId
 */
export async function fetchAdminFulfillmentDetail(accessToken, fulfillmentId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(fulfillmentId ?? "").trim());
  if (!id || id === "NaN") throw new Error("ID phiếu không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/fulfillments/${id}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/orders/:orderId/fulfillments
 * @param {string} accessToken
 * @param {string | number} orderId
 * @param {{ ticketType?: string; notes?: string }} [payload]
 */
export async function createAdminOrderFulfillment(accessToken, orderId, payload = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const oid = String(orderId ?? "").trim();
  if (!oid) throw new Error("Thiếu mã đơn hàng.");

  /** @type {Record<string, string>} */
  const body = {};
  const tt = payload.ticketType != null ? String(payload.ticketType).trim() : "";
  if (tt) body.ticketType = tt.slice(0, 100);
  const n = payload.notes != null ? String(payload.notes).trim() : "";
  if (n) body.notes = n.slice(0, 1000);

  const res = await fetch(apiUrl(`/api/admin/orders/${encodeURIComponent(oid)}/fulfillments`), {
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
 * GET /api/admin/fulfillments
 * @param {string} accessToken
 * @param {{ page?: number; pageSize?: number; status?: string; orderId?: string | number; assignedWorkerId?: string | number }} [query]
 * @returns {Promise<AdminFulfillmentListResult>}
 */
export async function fetchAdminFulfillments(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const aw = query.assignedWorkerId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status || undefined,
    orderId:
      query.orderId !== undefined && query.orderId !== null && query.orderId !== ""
        ? query.orderId
        : undefined,
    assignedWorkerId:
      aw !== undefined && aw !== null && String(aw).trim() !== "" && Number.isFinite(Number(aw)) && Number(aw) > 0
        ? Number(aw)
        : undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/fulfillments${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @param {string | undefined | null} status
 */
export function labelFulfillmentStatus(status) {
  if (!status) return "—";
  const hit = FULFILLMENT_STATUS_OPTIONS.find((o) => o.value === status);
  if (hit?.label) return hit.label;
  if (String(status).toLowerCase() === "cancelled" || String(status).toLowerCase() === "canceled") {
    return "Đã hủy";
  }
  return status;
}

/**
 * @param {string | undefined | null} ticketType
 */
export function labelFulfillmentTicketType(ticketType) {
  const v = String(ticketType ?? "").trim();
  if (!v) return "—";
  const hit = FULFILLMENT_TICKET_TYPE_OPTIONS.find((o) => o.value === v);
  if (hit?.label) return hit.label;
  const legacy = {
    STANDARD: "Giao tận nơi",
    Pack: "Đóng gói (cũ)",
    Ship: "Giao hàng (cũ)",
    Pick_List: "Nhặt hàng (cũ)",
    Pack_List: "Đóng gói (cũ)",
    Dispatch_Note: "Xuất xe (cũ)",
    Picking: "Soạn hàng (cũ)",
  };
  return legacy[v] ?? v;
}

/**
 * PUT /api/admin/fulfillments/:id/status
 * @param {string} accessToken
 * @param {number | string} fulfillmentId
 * @param {AdminFulfillmentStatusUpdateBody} body
 * @returns {Promise<AdminFulfillmentStatusUpdateData>}
 */
export async function updateAdminFulfillmentStatus(accessToken, fulfillmentId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(fulfillmentId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID phiếu không hợp lệ.");

  const notesRaw = body.notes != null ? String(body.notes) : "";
  const notesTrim = notesRaw.trim();
  const payload = {
    status: body.status,
    ...(notesTrim ? { notes: notesTrim.slice(0, 1000) } : {}),
  };

  const res = await fetch(apiUrl(`/api/admin/fulfillments/${id}/status`), {
    method: "PUT",
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
 * Phiếu chưa có nhân viên phụ trách (chỉ khi `assignedWorkerId` null/undefined).
 * @param {{ assignedWorkerId?: number | null }} row
 */
export function isFulfillmentWorkerUnassigned(row) {
  return row == null || row.assignedWorkerId == null;
}

/**
 * PUT /api/admin/fulfillments/:id/assign
 * @param {string} accessToken
 * @param {number | string} fulfillmentId
 * @param {{ workerId: number }} body
 * @returns {Promise<AdminFulfillmentStatusUpdateData>}
 */
export async function assignAdminFulfillmentWorker(accessToken, fulfillmentId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const id = Number(fulfillmentId);
  if (!Number.isFinite(id) || id < 1) throw new Error("ID phiếu không hợp lệ.");

  const workerId = Number(body.workerId);
  if (!Number.isFinite(workerId) || workerId < 1) throw new Error("Worker không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/fulfillments/${id}/assign`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({ workerId }),
  });

  return parseApiEnvelope(res);
}
