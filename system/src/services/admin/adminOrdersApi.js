import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/**
 * Giá trị gửi lên query `orderStatus` (PascalCase theo ví dụ API).
 * Luồng: New → AwaitingPayment → Confirmed → Processing → ReadyToShip → Shipped → Delivered → Completed
 */
/** Thứ tự timeline / workflow đơn hàng (dùng cho UI + cập nhật trạng thái). */
export const ADMIN_ORDER_STATUS_FLOW = [
  "New",
  "AwaitingPayment",
  "Confirmed",
  "Processing",
  "ReadyToShip",
  "Shipped",
  "Delivered",
  "Completed",
];

export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái đơn" },
  { value: "New", label: "Mới" },
  { value: "AwaitingPayment", label: "Chờ thanh toán" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Processing", label: "Đang xử lý" },
  { value: "ReadyToShip", label: "Sẵn sàng giao" },
  { value: "Shipped", label: "Đang giao" },
  { value: "Delivered", label: "Đã giao" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
];

/**
 * @param {string} [status]
 * @returns {number}
 */
export function getOrderStatusFlowIndex(status) {
  if (!status) return -1;
  const i = ADMIN_ORDER_STATUS_FLOW.indexOf(status);
  return i;
}

/** Thứ tự timeline thanh toán: chưa trả → một phần → đủ → hoàn tiền. */
export const ADMIN_PAYMENT_STATUS_FLOW = ["Unpaid", "PartiallyPaid", "Paid", "Refunded"];

/** Giá trị `paymentStatus` từ API (cùng tập với flow). */
export const ADMIN_PAYMENT_STATUS_VALUES = ADMIN_PAYMENT_STATUS_FLOW;

export const ADMIN_PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "Tất cả thanh toán" },
  { value: "Unpaid", label: "Chưa thanh toán" },
  { value: "PartiallyPaid", label: "Thanh toán một phần" },
  { value: "Paid", label: "Đã thanh toán" },
  { value: "Refunded", label: "Đã hoàn tiền" },
];

/** Chỉ các giá trị gửi form (không có mục “tất cả”). */
export const ADMIN_PAYMENT_STATUS_SELECT_OPTIONS = ADMIN_PAYMENT_STATUS_OPTIONS.filter((o) => o.value !== "");

/**
 * @param {string} [status]
 * @returns {number}
 */
export function getPaymentStatusFlowIndex(status) {
  if (!status) return -1;
  const normalized = status === "UnPaid" ? "Unpaid" : status;
  return ADMIN_PAYMENT_STATUS_FLOW.indexOf(normalized);
}

/**
 * @typedef {object} AdminOrderListItem
 * @property {number} id
 * @property {string} orderCode
 * @property {string} createdAt
 * @property {string} orderStatus
 * @property {string} paymentStatus
 * @property {string} paymentMethod
 * @property {number} lineCount
 * @property {number} merchandiseTotal
 * @property {number} discountTotal
 * @property {number} payableTotal
 * @property {number} customerId
 * @property {string} customerName
 * @property {string} customerPhone
 * @property {string} customerEmail
 * @property {string} customerType
 * @property {number | null} salesId
 * @property {string | null} salesName
 */

/**
 * @typedef {object} AdminOrderListResult
 * @property {AdminOrderListItem[]} items
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
 * GET /api/admin/orders — tất cả query đều optional.
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   search?: string;
 *   paymentStatus?: string;
 *   orderStatus?: string;
 *   customerId?: number;
 *   salesId?: number;
 * }} [query]
 * @returns {Promise<AdminOrderListResult>}
 */
export async function fetchAdminOrders(accessToken, query = {}) {
  if (!accessToken) {
    throw new Error("Chưa có access token.");
  }

  const sid = query.salesId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search?.trim() || undefined,
    paymentStatus: query.paymentStatus || undefined,
    orderStatus: query.orderStatus || undefined,
    customerId:
      query.customerId !== undefined && query.customerId !== null && query.customerId !== ""
        ? query.customerId
        : undefined,
    salesId:
      sid !== undefined && sid !== null && sid !== "" && Number.isFinite(Number(sid)) && Number(sid) > 0 ? Number(sid) : undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/orders${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/orders/{id}
 * @param {string} accessToken
 * @param {number | string} orderId
 * @returns {Promise<AdminOrderDetail>}
 */
/**
 * POST /api/admin/orders
 * @param {string} accessToken
 * @param {{
 *   customerId: number;
 *   shippingAddressId: number;
 *   paymentMethod: string;
 *   voucherCode?: string;
 *   note?: string;
 *   lines: { variantId: number; quantity: number }[];
 * }} body
 */
export async function createAdminOrder(accessToken, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl("/api/admin/orders"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      customerId: body.customerId,
      shippingAddressId: body.shippingAddressId,
      paymentMethod: body.paymentMethod,
      voucherCode: body.voucherCode?.trim() || undefined,
      note: body.note?.trim() || undefined,
      lines: body.lines,
    }),
  });

  return parseApiEnvelope(res);
}

export async function fetchAdminOrderDetail(accessToken, orderId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = String(orderId).trim();
  if (!id) throw new Error("Thiếu mã đơn.");

  const res = await fetch(apiUrl(`/api/admin/orders/${encodeURIComponent(id)}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/orders/by-code/{orderCode}
 * @param {string} accessToken
 * @param {string} orderCode
 * @returns {Promise<AdminOrderDetail>}
 */
export async function fetchAdminOrderByCode(accessToken, orderCode) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const c = encodeURIComponent(String(orderCode ?? "").trim());
  if (!c) throw new Error("Thiếu mã đơn.");
  const res = await fetch(apiUrl(`/api/admin/orders/by-code/${c}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });
  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminOrderDetailLine
 * @property {number} id
 * @property {number} variantId
 * @property {string} skuSnapshot
 * @property {number} quantity
 * @property {number} priceSnapshot
 * @property {number} subTotal
 * @property {string} currentSku
 * @property {string} variantName
 * @property {string} productName
 * @property {string | null} [imageUrl]
 */

/**
 * @typedef {object} AdminOrderDetail
 * @property {number} id
 * @property {string} orderCode
 * @property {string} createdAt
 * @property {string} orderStatus
 * @property {string} paymentStatus
 * @property {string} paymentMethod
 * @property {number} merchandiseTotal
 * @property {number} discountTotal
 * @property {number} payableTotal
 * @property {object} customer
 * @property {object | null} shippingAddress
 * @property {unknown | null} voucher
 * @property {unknown | null} sales
 * @property {AdminOrderDetailLine[]} lines
 * @property {number | null} quoteId
 * @property {number | null} contractId
 * @property {string | null} [payOsPaymentLinkId]
 * @property {string | null} [payOsCheckoutUrl]
 * @property {string | null} [payOsLinkExpiresAt]
 */

/**
 * PUT /api/admin/orders/{id}/status
 * @param {string} accessToken
 * @param {number} orderId
 * @param {{ status: string; note?: string }} body
 */
export async function updateAdminOrderStatus(accessToken, orderId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      status: body.status,
      note: body.note ?? "",
    }),
  });

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/orders/{id}/payment-status
 * @param {string} accessToken
 * @param {number} orderId
 * @param {{ paymentStatus: string; note?: string }} body
 */
export async function updateAdminOrderPaymentStatus(accessToken, orderId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const res = await fetch(apiUrl(`/api/admin/orders/${orderId}/payment-status`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      paymentStatus: body.paymentStatus,
      note: body.note ?? "",
    }),
  });

  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/orders/:id/cancel — Manager/Admin hủy đơn (chỉ whitelist trạng thái).
 * @param {string} accessToken
 * @param {number | string} orderId
 * @param {{ cancelReason: string }} body
 */
export async function cancelAdminOrder(accessToken, orderId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const reason = String(body?.cancelReason ?? "").trim();
  if (!reason) throw new Error("Vui lòng nhập lý do hủy đơn.");
  const id = encodeURIComponent(String(orderId));

  const res = await fetch(apiUrl(`/api/admin/orders/${id}/cancel`), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({ cancelReason: reason }),
  });

  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/orders/:id/assign-sales — Manager/Admin gán Sales phụ trách đơn.
 * @param {string} accessToken
 * @param {number | string} orderId
 * @param {{ salesId: number }} body
 */
export async function assignAdminOrderSales(accessToken, orderId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const salesId = Number(body?.salesId);
  if (!Number.isFinite(salesId) || salesId < 1) throw new Error("Nhân viên không hợp lệ.");
  const id = encodeURIComponent(String(orderId));

  const res = await fetch(apiUrl(`/api/admin/orders/${id}/assign-sales`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({ salesId }),
  });

  return parseApiEnvelope(res);
}

/** Whitelist trạng thái cho phép hủy đơn (theo `OrderStatuses.CanCancel`). */
export const ADMIN_ORDER_CAN_CANCEL = new Set([
  "New",
  "AwaitingPayment",
  "Confirmed",
  "Processing",
  "ReadyToShip",
]);

/** @param {string | undefined | null} status */
export function canCancelAdminOrder(status) {
  return ADMIN_ORDER_CAN_CANCEL.has(String(status ?? "").trim());
}

/**
 * Nhãn hiển thị cho orderStatus từ API.
 * @param {string} status
 */
export function labelOrderStatus(status) {
  if (!status) return "—";
  const hit = ADMIN_ORDER_STATUS_OPTIONS.find((o) => o.value === status);
  if (hit?.label) return hit.label;
  if (String(status).toLowerCase() === "cancelled" || String(status).toLowerCase() === "canceled") {
    return "Đã hủy";
  }
  return status;
}

/**
 * Nhãn phương thức thanh toán đơn (COD, PayOS, …) — ưu tiên mã ngắn trên list.
 * @param {string | undefined | null} method
 */
export function labelOrderPaymentMethod(method) {
  const raw = String(method ?? "").trim();
  if (!raw) return "—";
  const key = raw.replace(/\s+/g, "").toLowerCase();
  if (key === "cod") return "COD";
  if (key === "payos" || key.includes("payos")) return "PayOS";
  if (key === "banktransfer") return "Chuyển khoản";
  if (key === "cash") return "Tiền mặt";
  return raw;
}

/**
 * @param {string} status
 */
export function labelPaymentStatus(status) {
  if (!status) return "—";
  const hit = ADMIN_PAYMENT_STATUS_SELECT_OPTIONS.find((o) => o.value === status);
  if (hit) return hit.label;
  if (status === "UnPaid") return "Chưa thanh toán";
  return status;
}
