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
export function normalizeAdminWarrantyTicketList(data) {
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
 * Phân trang danh sách claim — cùng hình dạng `PagedResultDto` với phiếu (`dev/req.md`).
 * @param {unknown} data
 * @returns {{ items: object[]; totalCount: number; page: number; pageSize: number }}
 */
export function normalizeAdminWarrantyClaimList(data) {
  return normalizeAdminWarrantyTicketList(data);
}

/**
 * @param {unknown} arr
 * @returns {{ value: string; label: string }[]}
 */
function mapToValueLabelOptions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => {
    if (typeof x === "string") return { value: x, label: x };
    const o = /** @type {Record<string, unknown>} */ (x);
    const value = String(o.value ?? o.code ?? o.name ?? o.status ?? o.type ?? "");
    const label = String(o.label ?? o.displayName ?? o.description ?? o.name ?? value);
    return { value, label };
  });
}

/**
 * Luồng trạng thái claim — `bao-hanh.md` (PUT status).
 */
export const WARRANTY_CLAIM_STATUS_FLOW = [
  "Pending_Check",
  "Checking",
  "Confirmed_Defect",
  "Repairing",
  "Waiting_Pickup",
  "Completed",
];

/**
 * Cạnh chuyển trạng thái hợp lệ — `dev/req.md` §4 (`CanTransition`).
 * Key = `normKey(trạng thái hiện tại)`; giá trị = chuỗi gửi PUT (constant BE).
 */
const WARRANTY_CLAIM_CAN_TRANSITION_TO = /** @type {Record<string, string[]>} */ ({
  pending_check: ["Checking", "Cancelled"],
  checking: ["Confirmed_Defect", "Rejected", "Cancelled"],
  confirmed_defect: ["Repairing", "Cancelled"],
  repairing: ["Waiting_Pickup"],
  waiting_pickup: ["Completed"],
});

function normKey(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * Các trạng thái tiếp theo được phép từ `currentStatus` (rỗng nếu đã kết thúc hoặc không khớp pipeline).
 * @param {string | undefined | null} currentStatus
 * @returns {string[]}
 */
export function getAllowedWarrantyClaimNextStatuses(currentStatus) {
  const k = normKey(currentStatus);
  if (!k) return [];
  if (k === "completed" || k === "rejected" || k === "cancelled" || k === "canceled") return [];
  const next = WARRANTY_CLAIM_CAN_TRANSITION_TO[k];
  return Array.isArray(next) ? [...next] : [];
}

/**
 * Claim đã kết thúc pipeline (không còn PUT chuyển bước).
 * @param {string | undefined | null} status
 */
export function isWarrantyClaimTerminalStatus(status) {
  const k = normKey(status);
  return k === "completed" || k === "rejected" || k === "cancelled" || k === "canceled";
}

const TICKET_STATUS_LABEL_FALLBACK = {
  active: "Hiệu lực",
  valid: "Hiệu lực",
  expired: "Hết hạn",
  void: "Vô hiệu",
  voided: "Vô hiệu",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  draft: "Bản nháp",
};

const CLAIM_STATUS_LABEL_FALLBACK = {
  pending_check: "Chờ kiểm tra",
  checking: "Đang kiểm tra",
  confirmed_defect: "Xác nhận lỗi",
  repairing: "Đang sửa chữa",
  waiting_pickup: "Chờ khách nhận",
  completed: "Hoàn tất",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
};

/**
 * @param {string | undefined | null} status
 * @param {{ value: string; label: string }[]} [statusOptions]
 */
export function labelAdminWarrantyTicketStatus(status, statusOptions) {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const key = normKey(raw);
  const fb = TICKET_STATUS_LABEL_FALLBACK[key];
  const hit = statusOptions?.find((o) => {
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
    const fromVal = TICKET_STATUS_LABEL_FALLBACK[normKey(apiVal)];
    if (fromVal) return fromVal;
  }
  if (hit?.label != null && String(hit.label).trim() !== "") return String(hit.label).trim();
  return raw;
}

/**
 * @param {string | undefined | null} status
 * @param {{ value: string; label: string }[]} [statusOptions]
 */
export function labelAdminWarrantyClaimStatus(status, statusOptions) {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const key = normKey(raw);
  const fb = CLAIM_STATUS_LABEL_FALLBACK[key];
  const hit = statusOptions?.find((o) => {
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
    const fromVal = CLAIM_STATUS_LABEL_FALLBACK[normKey(apiVal)];
    if (fromVal) return fromVal;
  }
  if (hit?.label != null && String(hit.label).trim() !== "") return String(hit.label).trim();
  return raw;
}

/**
 * GET /api/admin/warranty-tickets/statuses
 * @returns {Promise<{ ticketStatuses: { value: string; label: string }[]; claimStatuses: { value: string; label: string }[] }>}
 */
export async function fetchAdminWarrantyStatuses(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/warranty-tickets/statuses"), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  const empty = { ticketStatuses: [], claimStatuses: [] };
  if (!data || typeof data !== "object") return empty;
  const d = /** @type {Record<string, unknown>} */ (data);

  let ticketStatuses = mapToValueLabelOptions(d.ticketStatuses ?? d.TicketStatuses ?? d.ticketStatusOptions);
  let claimStatuses = mapToValueLabelOptions(d.claimStatuses ?? d.ClaimStatuses ?? d.claimStatusOptions);

  if (!ticketStatuses.length && !claimStatuses.length) {
    const merged = d.statuses ?? d.Statuses ?? d.items ?? d.Items;
    if (Array.isArray(merged)) {
      const opts = mapToValueLabelOptions(merged);
      ticketStatuses = opts;
      claimStatuses = opts;
    }
  }

  if (!claimStatuses.length) {
    claimStatuses = WARRANTY_CLAIM_STATUS_FLOW.map((value) => ({
      value,
      label: labelAdminWarrantyClaimStatus(value, []),
    }));
  }

  return { ticketStatuses, claimStatuses };
}

/**
 * GET /api/admin/warranty-tickets
 */
export async function fetchAdminWarrantyTickets(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const cid = query.customerId;
  const oid = query.orderId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status?.trim() || undefined,
    customerId:
      cid !== undefined && cid !== null && String(cid).trim() !== "" && Number.isFinite(Number(cid)) && Number(cid) > 0
        ? Number(cid)
        : undefined,
    orderId:
      oid !== undefined && oid !== null && String(oid).trim() !== "" && Number.isFinite(Number(oid)) && Number(oid) > 0
        ? Number(oid)
        : undefined,
    fromDate: query.fromDate?.trim() || undefined,
    toDate: query.toDate?.trim() || undefined,
    search: query.search?.trim() || undefined,
  });
  const res = await fetch(apiUrl(`/api/admin/warranty-tickets${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return normalizeAdminWarrantyTicketList(await parseApiEnvelope(res));
}

/**
 * GET /api/admin/warranty-claims — `dev/req.md` (hàng đợi: `onlyOpen=true`).
 * @param {string} accessToken
 * @param {{
 *   page?: number;
 *   pageSize?: number;
 *   status?: string;
 *   onlyOpen?: boolean;
 *   customerId?: number | string;
 *   warrantyTicketId?: number | string;
 *   orderId?: number | string;
 *   fromDate?: string;
 *   toDate?: string;
 *   search?: string;
 * }} [query]
 */
export async function fetchAdminWarrantyClaims(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const cid = query.customerId;
  const tid = query.warrantyTicketId;
  const oid = query.orderId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status?.trim() || undefined,
    onlyOpen: query.onlyOpen === true ? true : query.onlyOpen === false ? false : undefined,
    customerId:
      cid !== undefined && cid !== null && String(cid).trim() !== "" && Number.isFinite(Number(cid)) && Number(cid) > 0
        ? Number(cid)
        : undefined,
    warrantyTicketId:
      tid !== undefined && tid !== null && String(tid).trim() !== "" && Number.isFinite(Number(tid)) && Number(tid) > 0
        ? Number(tid)
        : undefined,
    orderId:
      oid !== undefined && oid !== null && String(oid).trim() !== "" && Number.isFinite(Number(oid)) && Number(oid) > 0
        ? Number(oid)
        : undefined,
    fromDate: query.fromDate?.trim() || undefined,
    toDate: query.toDate?.trim() || undefined,
    search: query.search?.trim() || undefined,
  });
  const res = await fetch(apiUrl(`/api/admin/warranty-claims${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return normalizeAdminWarrantyClaimList(await parseApiEnvelope(res));
}

/**
 * API detail trả `customer` / `order` / `contract` lồng nhau — chuẩn hóa thêm field phẳng cho UI.
 * @param {unknown} data
 */
export function normalizeAdminWarrantyTicketDetail(data) {
  if (!data || typeof data !== "object") return null;
  const d = /** @type {Record<string, unknown>} */ (data);
  const customer = /** @type {Record<string, unknown> | undefined} */ (d.customer ?? d.Customer);
  const order = /** @type {Record<string, unknown> | undefined} */ (d.order ?? d.Order);
  const contract = /** @type {Record<string, unknown> | undefined} */ (d.contract ?? d.Contract);

  const customerId = customer?.id ?? customer?.Id ?? d.customerId ?? d.CustomerId;
  const customerName = customer?.fullName ?? customer?.FullName ?? d.customerName ?? d.CustomerName;
  const orderId = order?.id ?? order?.Id ?? d.orderId ?? d.OrderId;
  const orderCode = order?.orderCode ?? order?.OrderCode ?? d.orderCode ?? d.OrderCode;
  const contractId = contract?.id ?? contract?.Id ?? d.contractId ?? d.ContractId;
  const contractNumber =
    contract?.contractNumber ?? contract?.ContractNumber ?? d.contractNumber ?? d.ContractNumber;
  const issueDate = d.issueDate ?? d.IssueDate;
  const createdAt = issueDate ?? d.createdAt ?? d.CreatedAt;

  return {
    ...d,
    customer,
    order,
    contract,
    customerId,
    customerName,
    orderId,
    orderCode,
    contractId,
    contractNumber,
    issueDate,
    createdAt,
  };
}

/**
 * GET /api/admin/warranty-tickets/{id}
 */
export async function fetchAdminWarrantyTicketDetail(accessToken, ticketId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(ticketId ?? "").trim());
  if (!id) throw new Error("Thiếu mã phiếu.");
  const res = await fetch(apiUrl(`/api/admin/warranty-tickets/${id}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return normalizeAdminWarrantyTicketDetail(await parseApiEnvelope(res));
}

/**
 * GET /api/admin/warranty-tickets/by-number/{ticketNumber}
 */
export async function fetchAdminWarrantyTicketByNumber(accessToken, ticketNumber) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const n = encodeURIComponent(String(ticketNumber ?? "").trim());
  if (!n) throw new Error("Thiếu số phiếu.");
  const res = await fetch(apiUrl(`/api/admin/warranty-tickets/by-number/${n}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return normalizeAdminWarrantyTicketDetail(await parseApiEnvelope(res));
}

/**
 * POST /api/admin/warranty-tickets
 * @param {{ customerId: number; orderId?: number; contractId?: number; validUntil?: string }} payload
 */
export async function createAdminWarrantyTicket(accessToken, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/warranty-tickets"), {
    method: "POST",
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
 * POST /api/admin/warranty-tickets/{id}/claims
 */
export async function createAdminWarrantyTicketClaim(accessToken, ticketId, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(ticketId ?? "").trim());
  if (!id) throw new Error("Thiếu mã phiếu.");
  const res = await fetch(apiUrl(`/api/admin/warranty-tickets/${id}/claims`), {
    method: "POST",
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
 * GET /api/admin/warranty-claims/{id}
 */
export async function fetchAdminWarrantyClaimDetail(accessToken, claimId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(claimId ?? "").trim());
  if (!id) throw new Error("Thiếu mã yêu cầu.");
  const res = await fetch(apiUrl(`/api/admin/warranty-claims/${id}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * PUT /api/admin/warranty-claims/{id}/status
 * @param {{ status: string; estimatedCost?: number; resolution?: string; note?: string }} body
 */
export async function updateAdminWarrantyClaimStatus(accessToken, claimId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(claimId ?? "").trim());
  if (!id) throw new Error("Thiếu mã yêu cầu.");
  const res = await fetch(apiUrl(`/api/admin/warranty-claims/${id}/status`), {
    method: "PUT",
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
 * Badge phiếu bảo hành (UI).
 * @param {string | undefined | null} status
 */
export function warrantyTicketStatusBadgeClass(status) {
  const s = normKey(status);
  if (s === "active" || s === "valid") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (s === "expired") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  if (s === "void" || s === "voided" || s === "cancelled" || s === "canceled") {
    return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}
