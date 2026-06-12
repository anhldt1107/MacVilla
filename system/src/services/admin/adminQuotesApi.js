import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/**
 * Trạng thái báo giá (API). Mở rộng khi backend thêm giá trị.
 */
export const ADMIN_QUOTE_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Requested", label: "Đã yêu cầu" },
  { value: "Draft", label: "Nháp / đã tiếp nhận" },
  { value: "PendingApproval", label: "Chờ duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "CounterOffer", label: "Khách phản hồi / thương lượng" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "CustomerRejected", label: "Khách từ chối" },
  { value: "CustomerAccepted", label: "Khách chấp nhận" },
  { value: "Converted", label: "Đã chuyển đơn" },
  { value: "Expired", label: "Hết hạn" },
];

/**
 * @typedef {object} AdminQuoteListItem
 * @property {number} id
 * @property {string} quoteCode
 * @property {string} createdAt
 * @property {string} status
 * @property {number} lineCount
 * @property {number} totalAmount
 * @property {number | null} [discountValue]
 * @property {string | null} [discountType]
 * @property {number} finalAmount
 * @property {string | null} [validUntil]
 * @property {number} customerId
 * @property {string} [customerName]
 * @property {string} [customerPhone]
 * @property {string} [customerEmail]
 * @property {string} [companyName]
 * @property {string} [taxCode]
 * @property {number | null} [salesId]
 * @property {string | null} [salesName]
 * @property {number | null} [managerId]
 * @property {string | null} [managerName]
 */

/**
 * @typedef {object} AdminQuoteListResult
 * @property {AdminQuoteListItem[]} items
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
 * GET /api/admin/quotes
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   search?: string;
 *   status?: string;
 *   salesId?: number;
 *   customerId?: number;
 *   view?: "mine" | "queue" | "all";
 * }} [query]
 * @returns {Promise<AdminQuoteListResult>}
 */
export async function fetchAdminQuotes(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");

  const sid = query.salesId;
  const cid = query.customerId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search?.trim() || undefined,
    status: query.status || undefined,
    salesId:
      sid !== undefined && sid !== null && sid !== "" && Number.isFinite(Number(sid)) && Number(sid) > 0 ? Number(sid) : undefined,
    customerId:
      cid !== undefined && cid !== null && cid !== "" && Number.isFinite(Number(cid)) && Number(cid) > 0 ? Number(cid) : undefined,
    view: query.view || undefined,
  });

  const res = await fetch(apiUrl(`/api/admin/quotes${qs}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });

  return parseApiEnvelope(res);
}

/**
 * @typedef {object} AdminQuoteDetailCustomer
 * @property {number} id
 * @property {string} [fullName]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [customerType]
 * @property {string} [companyName]
 * @property {string} [taxCode]
 * @property {string} [companyAddress]
 * @property {number} [debtBalance]
 */

/**
 * @typedef {object} AdminQuoteDetailStaff
 * @property {number} [id]
 * @property {string} [fullName]
 * @property {string | null} [email]
 * @property {string | null} [phone]
 */

/**
 * @typedef {object} AdminQuoteDetailLine
 * @property {number} id
 * @property {number} variantId
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} subTotal
 * @property {string} [currentSku]
 * @property {string} [variantName]
 * @property {string} [productName]
 * @property {string | null} [imageUrl]
 * @property {number} [currentRetailPrice]
 */

/**
 * @typedef {object} AdminQuoteDetail
 * @property {number} id
 * @property {string} quoteCode
 * @property {string} createdAt
 * @property {string} status
 * @property {number} totalAmount
 * @property {string | null} [discountType]
 * @property {number | null} [discountValue]
 * @property {number} finalAmount
 * @property {string | null} [validUntil]
 * @property {string | null} [notes]
 * @property {string | null} [rejectReason]
 * @property {string | null} [approvedAt]
 * @property {string | null} [rejectedAt]
 * @property {string | null} [customerNotes]
 * @property {string | null} [counterOfferMessage]
 * @property {string | null} [customerRejectReason]
 * @property {string | null} [customerAcceptedAt]
 * @property {string | null} [customerRejectedAt]
 * @property {AdminQuoteDetailCustomer | null} [customer]
 * @property {AdminQuoteDetailStaff | null} [sales]
 * @property {AdminQuoteDetailStaff | null} [manager]
 * @property {AdminQuoteDetailLine[]} [lines]
 */

/**
 * GET /api/admin/quotes/:id
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function fetchAdminQuoteDetail(accessToken, quoteId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(quoteId));
  const res = await fetch(apiUrl(`/api/admin/quotes/${id}`), {
    method: "GET",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });
  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/quotes — tạo báo giá (`admin/bao-gia.md`, `salesId` từ token).
 * @param {string} accessToken
 * @param {{
 *   customerId: number;
 *   lines: { variantId: number; quantity: number; unitPrice?: number }[];
 *   discountType?: string | null;
 *   discountValue?: number | null;
 *   validUntil?: string | null;
 *   notes?: string | null;
 * }} body
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function createAdminQuote(accessToken, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const cid = Number(body?.customerId);
  if (!Number.isFinite(cid) || cid < 1) throw new Error("Chọn khách hàng hợp lệ.");
  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (lines.length < 1) throw new Error("Cần ít nhất một dòng hàng.");
  const res = await fetch(apiUrl("/api/admin/quotes"), {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({
      customerId: cid,
      lines,
      discountType: body.discountType ?? null,
      discountValue: body.discountValue ?? null,
      validUntil: body.validUntil ?? null,
      notes: body.notes ?? null,
    }),
  });
  return parseApiEnvelope(res);
}

/** Loại chiết khấu gửi API khi cập nhật báo giá Draft. */
export const ADMIN_QUOTE_DISCOUNT_TYPE_OPTIONS = [
  { value: "Percentage", label: "Phần trăm (%)" },
  { value: "FixedAmount", label: "Số tiền cố định" },
];

/**
 * PUT /api/admin/quotes/:id — cập nhật báo giá (thường khi status Draft).
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @param {{
 *   lines: { id: number; variantId: number; quantity: number; unitPrice: number }[];
 *   discountType: string | null;
 *   discountValue: number | null;
 *   validUntil: string | null;
 *   notes: string | null;
 * }} body
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function updateAdminQuote(accessToken, quoteId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qid = encodeURIComponent(String(quoteId));
  const res = await fetch(apiUrl(`/api/admin/quotes/${qid}`), {
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
 * PUT /api/admin/quotes/:id/assign — gán nhân viên sale (user id).
 * Body: `{ salesId }` (camelCase; backend ASP.NET thường chấp nhận).
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @param {{ salesId: number }} body
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function assignAdminQuoteSales(accessToken, quoteId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qid = encodeURIComponent(String(quoteId));
  const salesId = Number(body.salesId);
  if (!Number.isFinite(salesId) || salesId < 1) throw new Error("Nhân viên không hợp lệ.");

  const res = await fetch(apiUrl(`/api/admin/quotes/${qid}/assign`), {
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

/**
 * PUT /api/admin/quotes/:id/submit — gửi báo giá trạng thái Draft lên duyệt (→ PendingApproval).
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function submitAdminQuoteForApproval(accessToken, quoteId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qid = encodeURIComponent(String(quoteId));
  const res = await fetch(apiUrl(`/api/admin/quotes/${qid}/submit`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });
  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/quotes/:id/approve — duyệt báo giá (PendingApproval → Approved).
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function approveAdminQuote(accessToken, quoteId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qid = encodeURIComponent(String(quoteId));
  const res = await fetch(apiUrl(`/api/admin/quotes/${qid}/approve`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });
  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/quotes/:id/reject — từ chối báo giá (thường từ PendingApproval).
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @param {{ rejectReason: string }} body
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function rejectAdminQuote(accessToken, quoteId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qid = encodeURIComponent(String(quoteId));
  const rejectReason = String(body.rejectReason ?? "").trim();
  if (!rejectReason) throw new Error("Vui lòng nhập lý do từ chối.");

  const res = await fetch(apiUrl(`/api/admin/quotes/${qid}/reject`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({ rejectReason }),
  });
  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/quotes/:id/return-to-draft — trả Sales chỉnh lại (`manager/bao-gia.md`).
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function returnAdminQuoteToDraft(accessToken, quoteId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qid = encodeURIComponent(String(quoteId));
  const res = await fetch(apiUrl(`/api/admin/quotes/${qid}/return-to-draft`), {
    method: "PUT",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
  });
  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/quotes/:id/convert-to-order — CustomerAccepted → Converted; tạo đơn.
 * @param {string} accessToken
 * @param {string | number} quoteId
 * @param {{
 *   shippingAddressId: number;
 *   paymentMethod: string;
 *   note?: string | null;
 *   contractId?: number | null;
 * }} body
 * @returns {Promise<unknown>} `AdminOrderDetailDto` (theo tài liệu tích hợp)
 */
export async function convertAdminQuoteToOrder(accessToken, quoteId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const qid = encodeURIComponent(String(quoteId));
  const shippingAddressId = Number(body.shippingAddressId);
  if (!Number.isFinite(shippingAddressId) || shippingAddressId < 1) {
    throw new Error("Địa chỉ giao hàng không hợp lệ.");
  }
  const paymentMethod = String(body.paymentMethod ?? "").trim();
  if (!paymentMethod) throw new Error("Vui lòng chọn phương thức thanh toán.");

  const payload = {
    shippingAddressId,
    paymentMethod,
  };
  const note = body.note != null && String(body.note).trim() ? String(body.note).trim() : null;
  if (note) payload.note = note;
  const contractId = body.contractId != null ? Number(body.contractId) : NaN;
  if (Number.isFinite(contractId) && contractId >= 1) payload.contractId = contractId;

  const res = await fetch(apiUrl(`/api/admin/quotes/${qid}/convert-to-order`), {
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
 * GET /api/admin/quotes/by-code/:quoteCode
 * @param {string} accessToken
 * @param {string} quoteCode
 * @returns {Promise<AdminQuoteDetail>}
 */
export async function fetchAdminQuoteByCode(accessToken, quoteCode) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const c = encodeURIComponent(String(quoteCode ?? "").trim());
  if (!c) throw new Error("Thiếu mã báo giá.");
  const res = await fetch(apiUrl(`/api/admin/quotes/by-code/${c}`), {
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
export function labelAdminQuoteStatus(status) {
  const hit = ADMIN_QUOTE_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status ?? "—";
}

/**
 * @param {string | undefined | null} status
 */
export function adminQuoteStatusBadgeClass(status) {
  const s = (status || "").trim();
  if (s === "Requested") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  if (s === "CustomerAccepted") {
    return "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/90 dark:bg-emerald-950/35 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (s === "Draft") {
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
  }
  if (s === "PendingApproval") {
    return "bg-violet-50 text-violet-950 ring-1 ring-violet-200/90 dark:bg-violet-950/40 dark:text-violet-100 dark:ring-violet-800/50";
  }
  if (s === "Approved") {
    return "bg-teal-50 text-teal-950 ring-1 ring-teal-200/90 dark:bg-teal-950/40 dark:text-teal-100 dark:ring-teal-800/50";
  }
  if (s === "CounterOffer") {
    return "bg-fuchsia-50 text-fuchsia-950 ring-1 ring-fuchsia-200/90 dark:bg-fuchsia-950/40 dark:text-fuchsia-100 dark:ring-fuchsia-800/50";
  }
  if (s === "Rejected") {
    return "bg-red-50 text-red-950 ring-1 ring-red-200/90 dark:bg-red-950/40 dark:text-red-100 dark:ring-red-800/50";
  }
  if (s === "CustomerRejected") {
    return "bg-rose-50 text-rose-950 ring-1 ring-rose-200/90 dark:bg-rose-950/40 dark:text-rose-100 dark:ring-rose-800/50";
  }
  if (s === "Converted") {
    return "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (s === "Expired") {
    return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-300/80 dark:bg-zinc-800/70 dark:text-zinc-200 dark:ring-zinc-600";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}

/**
 * @param {string | null | undefined} discountType
 * @param {number | null | undefined} discountValue
 */
export function formatQuoteDiscount(discountType, discountValue) {
  if (discountValue == null || discountValue === "") return "—";
  const t = (discountType || "").toLowerCase().replace(/\s/g, "");
  if (t === "percentage") {
    return `${Number(discountValue)}%`;
  }
  if (t === "fixedamount") {
    return `${Number(discountValue).toLocaleString("vi-VN")} đ`;
  }
  return `${Number(discountValue).toLocaleString("vi-VN")} đ`;
}
