import { fetchAdminOrderByCode, fetchAdminOrderDetail } from "@/services/admin/adminOrdersApi";

/**
 * ID đơn từ một dòng danh sách (API camelCase / PascalCase).
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {number | null}
 */
export function staffOrderListRowId(row) {
  if (!row || typeof row !== "object") return null;
  const v = row.id ?? row.Id ?? row.orderId ?? row.OrderId;
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Mã đơn từ một dòng danh sách.
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {string | null}
 */
export function staffOrderListRowCode(row) {
  if (!row || typeof row !== "object") return null;
  const code = row.orderCode ?? row.OrderCode;
  if (code == null) return null;
  const s = String(code).trim();
  return s || null;
}

/**
 * URL chi tiết đơn theo shell hiện tại (admin / manager / saler).
 * @param {{ ordersList: string }} paths
 * @param {{ orderId?: unknown; orderCode?: unknown }} links
 * @returns {string | null}
 */
export function staffOrderDetailHref(paths, { orderId, orderCode } = {}) {
  const idNum =
    orderId != null && Number.isFinite(Number(orderId)) && Number(orderId) > 0 ? Number(orderId) : null;
  if (idNum != null) {
    return `${paths.ordersList}/${encodeURIComponent(String(idNum))}`;
  }
  const code = orderCode != null ? String(orderCode).trim() : "";
  if (code) {
    return `${paths.ordersList}/${encodeURIComponent(code)}`;
  }
  return null;
}

/**
 * GET đơn theo ID số hoặc mã đơn (param route :id có thể là orderCode).
 * @param {string} accessToken
 * @param {string | number | null | undefined} idOrCode
 */
export async function fetchAdminOrderDetailResolved(accessToken, idOrCode) {
  const raw = String(idOrCode ?? "").trim();
  if (!raw) throw new Error("Thiếu mã đơn.");
  if (/^\d+$/.test(raw)) {
    return fetchAdminOrderDetail(accessToken, raw);
  }
  return fetchAdminOrderByCode(accessToken, decodeURIComponent(raw));
}
