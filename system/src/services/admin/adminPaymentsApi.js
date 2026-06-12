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
export function normalizeAdminPaymentList(data) {
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
 * @param {unknown} data
 * @returns {{ value: string; label: string }[]}
 */
function parseValueLabelOptions(data) {
  if (Array.isArray(data)) {
    return data.map((x) => {
      if (typeof x === "string") return { value: x, label: x };
      const o = /** @type {Record<string, unknown>} */ (x);
      const value = String(o.value ?? o.code ?? o.name ?? o.type ?? "");
      const label = String(o.label ?? o.displayName ?? o.description ?? o.name ?? value);
      return { value, label };
    });
  }
  const d = /** @type {Record<string, unknown>} */ (data || {});
  const arr = /** @type {unknown[]} */ (d.items ?? d.types ?? d.transactionTypes ?? d.Items ?? []);
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => {
    if (typeof x === "string") return { value: x, label: x };
    const o = /** @type {Record<string, unknown>} */ (x);
    const value = String(o.value ?? o.code ?? o.name ?? o.type ?? "");
    const label = String(o.label ?? o.displayName ?? o.description ?? o.name ?? value);
    return { value, label };
  });
}

/**
 * GET /api/admin/payments/transaction-types
 * @param {string} accessToken
 */
export async function fetchAdminPaymentTransactionTypes(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/payments/transaction-types"), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  return parseValueLabelOptions(data);
}

/**
 * GET /api/admin/payments
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   customerId?: string | number;
 *   invoiceId?: string | number;
 *   orderId?: string | number;
 *   transactionType?: string;
 *   paymentMethod?: string;
 *   fromDate?: string;
 *   toDate?: string;
 *   search?: string;
 * }} [query]
 */
export async function fetchAdminPayments(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const cid = query.customerId;
  const iid = query.invoiceId;
  const oid = query.orderId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    customerId:
      cid !== undefined && cid !== null && String(cid).trim() !== "" && Number.isFinite(Number(cid)) && Number(cid) > 0
        ? Number(cid)
        : undefined,
    invoiceId:
      iid !== undefined && iid !== null && String(iid).trim() !== "" && Number.isFinite(Number(iid)) && Number(iid) > 0
        ? Number(iid)
        : undefined,
    orderId:
      oid !== undefined && oid !== null && String(oid).trim() !== "" && Number.isFinite(Number(oid)) && Number(oid) > 0
        ? Number(oid)
        : undefined,
    transactionType: query.transactionType?.trim() || undefined,
    paymentMethod: query.paymentMethod?.trim() || undefined,
    fromDate: query.fromDate?.trim() || undefined,
    toDate: query.toDate?.trim() || undefined,
    search: query.search?.trim() || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/payments${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const raw = await parseApiEnvelope(res);
  return normalizeAdminPaymentList(raw);
}

/**
 * GET /api/admin/payments/{id}
 */
export async function fetchAdminPaymentDetail(accessToken, paymentId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(paymentId ?? "").trim());
  if (!id) throw new Error("Thiếu mã giao dịch.");
  const res = await fetch(apiUrl(`/api/admin/payments/${id}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminPaymentRecordPayload
 * @property {number} customerId
 * @property {number} [invoiceId]
 * @property {number} amount
 * @property {string} paymentMethod
 * @property {string} paymentDate
 * @property {string} [referenceCode]
 * @property {string} [note]
 */

/**
 * POST /api/admin/payments
 * @param {string} accessToken
 * @param {AdminPaymentRecordPayload} payload
 */
export async function createAdminPayment(accessToken, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!payload || typeof payload !== "object") throw new Error("Payload thanh toán không hợp lệ.");
  const res = await fetch(apiUrl("/api/admin/payments"), {
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
 * POST /api/admin/payments/refund
 * @param {string} accessToken
 * @param {AdminPaymentRecordPayload} payload
 */
export async function createAdminPaymentRefund(accessToken, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!payload || typeof payload !== "object") throw new Error("Payload hoàn tiền không hợp lệ.");
  const res = await fetch(apiUrl("/api/admin/payments/refund"), {
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

function normKey(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

const PAYMENT_METHOD_LABEL_FALLBACK = {
  banktransfer: "Chuyển khoản",
  cash: "Tiền mặt",
  card: "Thẻ",
  momo: "MoMo",
  vnpay: "VNPay",
  zalopay: "ZaloPay",
  cod: "Thu hộ (COD)",
  payos: "PayOS",
  other: "Khác",
};

/**
 * @param {string | undefined | null} method
 */
export function labelAdminPaymentMethod(method) {
  const raw = String(method ?? "").trim();
  if (!raw) return "—";
  const fb = PAYMENT_METHOD_LABEL_FALLBACK[normKey(raw)];
  if (fb) return fb;
  return raw;
}

/** Chuẩn hóa mã loại GD (PascalCase / snake_case) → nhãn tiếng Việt khi API không gửi label riêng. */
const TX_TYPE_LABEL_FALLBACK = {
  payment: "Thu tiền",
  receipt: "Thu tiền",
  income: "Thu tiền",
  incoming: "Thu tiền",
  incomingpayment: "Thu tiền",
  invoicepayment: "Thanh toán hóa đơn",
  collection: "Thu nợ",
  expense: "Chi tiền",
  outgoing: "Chi tiền",
  outgoingpayment: "Chi tiền",
  payout: "Chi trả",
  refund: "Hoàn tiền",
  credit: "Ghi có",
  debit: "Ghi nợ",
  creditnote: "Ghi có (chứng từ)",
  debitnote: "Ghi nợ (chứng từ)",
  adjustment: "Điều chỉnh",
  transfer: "Chuyển khoản",
  reversal: "Hoàn tác",
  chargeback: "Thu hồi thẻ",
  fee: "Phí giao dịch",
  bankfee: "Phí ngân hàng",
  discount: "Giảm giá / chiết khấu",
  writeoff: "Xóa nợ",
  allocation: "Phân bổ",
  settlement: "Quyết toán",
  topup: "Nạp tiền",
  withdrawal: "Rút tiền",
  deposit: "Tiền gửi",
  hold: "Tạm giữ",
  releasehold: "Giải tỏa tạm giữ",
  void: "Vô hiệu",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
};

/**
 * Nhãn hiển thị cho một option loại GD (dropdown, bảng).
 * @param {string | undefined | null} transactionType
 * @param {{ value: string; label: string }[]} [typeOptions]
 */
export function labelAdminPaymentTransactionType(transactionType, typeOptions) {
  const raw = String(transactionType ?? "").trim();
  if (!raw) return "—";
  const key = normKey(raw);
  const fb = TX_TYPE_LABEL_FALLBACK[key];
  const hit = typeOptions?.find((o) => {
    const v = String(o?.value ?? "").trim();
    return v === raw || normKey(v) === key;
  });
  const apiLabel = hit != null ? String(hit.label ?? "").trim() : "";
  const apiVal = hit != null ? String(hit.value ?? raw).trim() : "";
  const untranslated =
    !apiLabel || apiLabel === apiVal || normKey(apiLabel) === normKey(apiVal) || normKey(apiLabel) === key;

  if (fb) {
    if (!hit || untranslated) return fb;
    return apiLabel;
  }
  if (hit && !untranslated && apiLabel) return apiLabel;
  if (hit && untranslated) {
    const fromVal = TX_TYPE_LABEL_FALLBACK[normKey(apiVal)];
    if (fromVal) return fromVal;
  }
  if (hit?.label != null && String(hit.label).trim() !== "") return String(hit.label).trim();
  return raw;
}

/**
 * Badge màu theo loại / dấu tiền (UI).
 * @param {string | undefined | null} transactionType
 * @param {number | undefined | null} [amount]
 */
export function paymentRowAccentClass(transactionType, amount) {
  const t = normKey(transactionType);
  const outflow =
    t === "refund" ||
    t === "outgoing" ||
    t === "outgoingpayment" ||
    t === "expense" ||
    t === "payout" ||
    t === "withdrawal" ||
    t === "chargeback" ||
    t === "debit" ||
    t === "debitnote";
  if (outflow || (amount != null && Number(amount) < 0)) {
    return "text-rose-800 dark:text-rose-200";
  }
  return "text-emerald-900 dark:text-emerald-100";
}
