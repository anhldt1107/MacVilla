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
 */
export function normalizeAdminReturnList(data) {
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
 * @param {unknown} arr
 * @returns {{ value: string; label: string }[]}
 */
function mapToValueLabelOptions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => {
    if (typeof x === "string") return { value: x, label: x };
    const o = /** @type {Record<string, unknown>} */ (x);
    const value = String(o.value ?? o.code ?? o.name ?? o.type ?? "");
    const label = String(o.label ?? o.displayName ?? o.description ?? o.name ?? value);
    return { value, label };
  });
}

function normKey(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase()
    .replace(/_/g, "");
}

/** Theo `ReturnTicketStatuses` (BE). */
const RETURN_STATUS_LABEL_FALLBACK = {
  draft: "Bản nháp",
  submitted: "Đã gửi",
  requested: "Yêu cầu đổi trả",
  pending: "Chờ xử lý",
  pendingapproval: "Chờ duyệt",
  awaitingapproval: "Chờ duyệt",
  pendingmanager: "Chờ quản lý",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  processing: "Đang thu hồi",
  inprogress: "Đang thu hồi",
  itemsreceived: "Đã nhận hàng",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
};

const RETURN_TYPE_LABEL_FALLBACK = {
  return: "Trả hàng",
  exchange: "Đổi hàng",
};

/** Theo `InventoryActions` (BE): Restock, Dispose, PendingInspection. */
const INVENTORY_ACTION_LABEL_FALLBACK = {
  restock: "Nhập lại kho",
  dispose: "Thanh lý",
  pendinginspection: "Chờ kiểm tra",
};

const DEFAULT_INVENTORY_ACTION_VALUES = ["Restock", "Dispose", "PendingInspection"];

/**
 * @param {{ value: string; label: string }[]} options
 * @returns {{ value: string; label: string }[]}
 */
export function localizeAdminReturnStatusOptions(options) {
  const src = Array.isArray(options) ? options : [];
  return src
    .filter((o) => o?.value)
    .map((o) => ({
      value: String(o.value),
      label: labelAdminReturnStatus(o.value, src),
    }));
}

/**
 * @param {{ value: string; label: string }[]} [options]
 * @returns {{ value: string; label: string }[]}
 */
export function localizeAdminReturnInventoryActionOptions(options) {
  const src = Array.isArray(options) && options.length ? options : DEFAULT_INVENTORY_ACTION_VALUES.map((value) => ({ value, label: value }));
  return src
    .filter((o) => o?.value)
    .map((o) => ({
      value: String(o.value),
      label: labelAdminReturnInventoryAction(o.value, src),
    }));
}

/**
 * @param {string | undefined | null} status
 * @param {{ value: string; label: string }[]} [options]
 */
export function labelAdminReturnStatus(status, options) {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const key = normKey(raw);
  const fb = RETURN_STATUS_LABEL_FALLBACK[key];
  const hit = options?.find((o) => {
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
  if (hit?.label != null && String(hit.label).trim() !== "") return String(hit.label).trim();
  return raw;
}

/**
 * @param {string | undefined | null} type
 * @param {{ value: string; label: string }[]} [options]
 */
export function labelAdminReturnType(type, options) {
  const raw = String(type ?? "").trim();
  if (!raw) return "—";
  const key = normKey(raw);
  const fb = RETURN_TYPE_LABEL_FALLBACK[key];
  const hit = options?.find((o) => {
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
  if (hit?.label != null && String(hit.label).trim() !== "") return String(hit.label).trim();
  return raw;
}

/**
 * @param {string | undefined | null} action
 * @param {{ value: string; label: string }[]} [options]
 */
export function labelAdminReturnInventoryAction(action, options) {
  const raw = String(action ?? "").trim();
  if (!raw) return "—";
  const key = normKey(raw);
  const fb = INVENTORY_ACTION_LABEL_FALLBACK[key];
  const hit = options?.find((o) => {
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
  if (hit?.label != null && String(hit.label).trim() !== "") return String(hit.label).trim();
  return raw;
}

/**
 * @param {string | undefined | null} status
 */
export function adminReturnStatusBadgeClass(status) {
  const s = normKey(status);
  if (s.includes("complet")) {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
  }
  if (s.includes("reject") || s.includes("cancel")) {
    return "bg-rose-50 text-rose-950 ring-1 ring-rose-200/90 dark:bg-rose-950/35 dark:text-rose-100 dark:ring-rose-800/50";
  }
  if (s.includes("approv") && !s.includes("pending")) {
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200/90 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
  }
  if (s.includes("pending") || s === "submitted" || s === "draft" || s === "requested") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-800/50";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}

/**
 * Hiển thị nút duyệt / từ chối — BE vẫn validate quyền Manager.
 * @param {string | undefined | null} status
 */
export function returnAllowsApproveReject(status) {
  const s = normKey(status);
  if (!s) return false;
  if (s.includes("complet") || s.includes("reject") || s.includes("cancel")) return false;
  if (s === "approved" || (s.includes("approv") && !s.includes("pending"))) return false;
  return (
    s.includes("pending") ||
    s === "requested" ||
    s.includes("submitted") ||
    s === "draft" ||
    s.includes("awaiting") ||
    s === "new"
  );
}

/**
 * Hiển thị luồng hoàn tất (kho + hoàn tiền).
 * @param {string | undefined | null} status
 */
export function returnAllowsStartProcessing(status) {
  const s = normKey(status);
  return s === "approved" || (s.includes("approv") && !s.includes("pending"));
}

export function returnAllowsReceive(status) {
  const s = normKey(status);
  return s.includes("processing") || s === "inprogress";
}

export function returnAllowsComplete(status) {
  const s = normKey(status);
  if (!s) return false;
  return s === "itemsreceived" || s.includes("itemsreceived");
}

/** Phiếu đã duyệt — bước kho do StockManager xử lý (hint Manager/Admin). */
export function returnShowsWarehouseHandoffHint(status) {
  const s = normKey(status);
  if (!s || s.includes("reject") || s.includes("cancel") || s.includes("complet")) return false;
  return (
    s === "approved" ||
    s.includes("approved") ||
    s.includes("processing") ||
    s === "itemsreceived" ||
    s.includes("itemsreceived")
  );
}

/** Khách hủy yêu cầu: Requested / PendingApproval (theo ReturnTicketStatuses.CanCancel phía khách). */
export function returnAllowsCustomerCancel(status) {
  const s = normKey(status);
  return s === "requested" || s.includes("pendingapproval") || s === "pendingapproval";
}

/**
 * @param {string | undefined | null} roleName
 */
export function staffRoleIsManagerOrAdmin(roleName) {
  const r = normKey(roleName).replace(/[^a-z]/g, "");
  return r.includes("admin") || r.includes("manager");
}

/**
 * GET /api/admin/returns/statuses
 * @returns {Promise<{ returnStatuses: { value: string; label: string }[]; inventoryActions: { value: string; label: string }[] }>}
 */
export async function fetchAdminReturnStatuses(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/returns/statuses"), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  const empty = { returnStatuses: [], inventoryActions: [] };
  if (!data || typeof data !== "object") return empty;
  const d = /** @type {Record<string, unknown>} */ (data);

  let returnStatuses = mapToValueLabelOptions(
    d.returnStatuses ?? d.ReturnStatuses ?? d.statuses ?? d.Statuses ?? d.items
  );
  let inventoryActions = mapToValueLabelOptions(
    d.inventoryActions ?? d.InventoryActions ?? d.actions ?? d.inventoryActionOptions
  );

  if (!returnStatuses.length && Array.isArray(data)) {
    returnStatuses = mapToValueLabelOptions(data);
  }

  if (!inventoryActions.length) {
    inventoryActions = DEFAULT_INVENTORY_ACTION_VALUES.map((value) => ({ value, label: value }));
  }

  return {
    returnStatuses: localizeAdminReturnStatusOptions(returnStatuses),
    inventoryActions: localizeAdminReturnInventoryActionOptions(inventoryActions),
  };
}

/**
 * GET /api/admin/returns/types
 */
export async function fetchAdminReturnTypes(accessToken) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/returns/types"), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  const data = await parseApiEnvelope(res);
  if (Array.isArray(data)) return mapToValueLabelOptions(data);
  const d = /** @type {Record<string, unknown>} */ (data || {});
  const arr = d.types ?? d.Types ?? d.items ?? d.Items;
  const opts = mapToValueLabelOptions(arr);
  if (opts.length) return opts;
  return [
    { value: "Return", label: labelAdminReturnType("Return", []) },
    { value: "Exchange", label: labelAdminReturnType("Exchange", []) },
  ];
}

/**
 * GET /api/admin/returns
 */
export async function fetchAdminReturns(accessToken, query = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const cid = query.customerId;
  const oid = query.orderId;
  const qs = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    status: query.status?.trim() || undefined,
    type: query.type?.trim() || undefined,
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
  const res = await fetch(apiUrl(`/api/admin/returns${qs}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return normalizeAdminReturnList(await parseApiEnvelope(res));
}

/**
 * GET /api/admin/returns/{id}
 */
export async function fetchAdminReturnDetail(accessToken, returnId) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(returnId ?? "").trim());
  if (!id) throw new Error("Thiếu mã phiếu.");
  const res = await fetch(apiUrl(`/api/admin/returns/${id}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * GET /api/admin/returns/by-number/{ticketNumber}
 */
export async function fetchAdminReturnByNumber(accessToken, ticketNumber) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const n = encodeURIComponent(String(ticketNumber ?? "").trim());
  if (!n) throw new Error("Thiếu số phiếu.");
  const res = await fetch(apiUrl(`/api/admin/returns/by-number/${n}`), {
    method: "GET",
    headers: { Accept: "*/*", ...bearerHeaders(accessToken) },
  });
  return parseApiEnvelope(res);
}

/**
 * POST /api/admin/returns
 */
export async function createAdminReturn(accessToken, payload) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const res = await fetch(apiUrl("/api/admin/returns"), {
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
 * PUT /api/admin/returns/{id}/approve
 */
export async function approveAdminReturn(accessToken, returnId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(returnId ?? "").trim());
  if (!id) throw new Error("Thiếu mã phiếu.");
  const res = await fetch(apiUrl(`/api/admin/returns/${id}/approve`), {
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
 * PUT /api/admin/returns/{id}/reject
 */
export async function rejectAdminReturn(accessToken, returnId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(returnId ?? "").trim());
  if (!id) throw new Error("Thiếu mã phiếu.");
  const res = await fetch(apiUrl(`/api/admin/returns/${id}/reject`), {
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
 * PUT /api/admin/returns/{id}/complete
 */
export async function completeAdminReturn(accessToken, returnId, body) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(returnId ?? "").trim());
  if (!id) throw new Error("Thiếu mã phiếu.");
  const res = await fetch(apiUrl(`/api/admin/returns/${id}/complete`), {
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

export async function startProcessingAdminReturn(accessToken, returnId, body = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(returnId ?? "").trim());
  const res = await fetch(apiUrl(`/api/admin/returns/${id}/start-processing`), {
    method: "PUT",
    headers: { Accept: "*/*", "Content-Type": "application/json", ...bearerHeaders(accessToken) },
    body: JSON.stringify(body),
  });
  return parseApiEnvelope(res);
}

export async function receiveAdminReturnItems(accessToken, returnId, body = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(returnId ?? "").trim());
  const res = await fetch(apiUrl(`/api/admin/returns/${id}/receive-items`), {
    method: "PUT",
    headers: { Accept: "*/*", "Content-Type": "application/json", ...bearerHeaders(accessToken) },
    body: JSON.stringify(body),
  });
  return parseApiEnvelope(res);
}

export async function cancelAdminReturn(accessToken, returnId, body = {}) {
  if (!accessToken) throw new Error("Chưa có access token.");
  const id = encodeURIComponent(String(returnId ?? "").trim());
  const res = await fetch(apiUrl(`/api/admin/returns/${id}/cancel`), {
    method: "PUT",
    headers: { Accept: "*/*", "Content-Type": "application/json", ...bearerHeaders(accessToken) },
    body: JSON.stringify(body),
  });
  return parseApiEnvelope(res);
}
