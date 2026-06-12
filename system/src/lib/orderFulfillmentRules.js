import {
  ADMIN_ORDER_STATUS_FLOW,
  canCancelAdminOrder,
} from "@/services/admin/adminOrdersApi";
import { FULFILLMENT_STATUS_FLOW } from "@/services/admin/adminFulfillmentsApi";

const ACTIVE_FULFILLMENT = new Set(["Pending", "Picking", "Packed"]);

const ORDER_BLOCKED_CREATE = new Set([
  "Cancelled",
  "New",
  "AwaitingPayment",
  "Delivered",
  "Completed",
]);

const ORDER_CREATE_ALLOWED = new Set(["Confirmed", "Processing", "ReadyToShip"]);

/** Trạng thái phiếu đang xử lý (Pending | Picking | Packed). */
export function isActiveFulfillmentStatus(status) {
  return ACTIVE_FULFILLMENT.has(String(status ?? "").trim());
}

/** Mirror BE `OrderStatuses.CanTransition`. */
export function canOrderTransition(from, to) {
  const f = String(from ?? "").trim();
  const t = String(to ?? "").trim();
  if (!f || !t || f === t) return false;
  const key = `${f}->${t}`;
  return (
    {
      "New->Confirmed": true,
      "New->Cancelled": true,
      "AwaitingPayment->Confirmed": true,
      "AwaitingPayment->Cancelled": true,
      "Confirmed->Processing": true,
      "Confirmed->Cancelled": true,
      "Processing->ReadyToShip": true,
      "Processing->Cancelled": true,
      "ReadyToShip->Shipped": true,
      "ReadyToShip->Cancelled": true,
      "Shipped->Delivered": true,
      "Delivered->Completed": true,
    }[key] === true
  );
}

/** Mirror BE `FulfillmentStatuses.CanTransition`. */
export function canFulfillmentTransition(from, to) {
  const f = String(from ?? "").trim();
  const t = String(to ?? "").trim();
  if (!f || !t || f === t) return false;
  const key = `${f}->${t}`;
  return (
    {
      "Pending->Picking": true,
      "Pending->Cancelled": true,
      "Picking->Packed": true,
      "Picking->Cancelled": true,
      "Packed->Shipped": true,
      "Packed->Cancelled": true,
    }[key] === true
  );
}

export function canFulfillmentCancel(status) {
  return isActiveFulfillmentStatus(status);
}

/** Bước tiếp theo trên timeline chính (không gồm Cancelled). */
export function getForwardOrderStatus(current) {
  const c = String(current ?? "").trim();
  const idx = ADMIN_ORDER_STATUS_FLOW.indexOf(c);
  if (idx < 0 || idx >= ADMIN_ORDER_STATUS_FLOW.length - 1) return null;
  const next = ADMIN_ORDER_STATUS_FLOW[idx + 1];
  return canOrderTransition(c, next) ? next : null;
}

/** Bước tiếp theo phiếu (không gồm Cancelled). */
export function getForwardFulfillmentStatus(current) {
  const c = String(current ?? "").trim();
  const idx = FULFILLMENT_STATUS_FLOW.indexOf(c);
  if (idx < 0 || idx >= FULFILLMENT_STATUS_FLOW.length - 1) return null;
  const next = FULFILLMENT_STATUS_FLOW[idx + 1];
  return canFulfillmentTransition(c, next) ? next : null;
}

/**
 * @param {string | undefined | null} shell admin | manager | saler | stock-manager | worker
 */
function filterOrderTransitionsForShell(candidates, shell) {
  const autoSync = new Set(["Processing", "ReadyToShip"]);

  return candidates.filter((s) => {
    if (shell === "saler") return s === "Delivered";
    if (shell === "stock-manager" || shell === "worker") return false;
    if (shell === "admin" || shell === "manager") {
      if (autoSync.has(s)) return false;
      return true;
    }
    return true;
  });
}

/**
 * Trạng thái đơn có thể chọn trong dialog (chỉ bước kế + hủy).
 * @param {object} [options]
 * @param {string[]} [options.allowedFromApi]
 * @param {string} [options.shell]
 */
export function getNextOrderStatuses(current, options = {}) {
  const { allowedFromApi, shell } = options;
  let candidates = [];

  if (allowedFromApi?.length) {
    candidates = allowedFromApi.filter((t) => canOrderTransition(current, t) || t === "Cancelled");
  } else {
    const forward = getForwardOrderStatus(current);
    if (forward) candidates.push(forward);
    if (canCancelAdminOrder(current)) candidates.push("Cancelled");
  }

  const seen = new Set();
  const unique = candidates.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });

  return filterOrderTransitionsForShell(unique, shell);
}

/**
 * @param {object} [options]
 * @param {string[]} [options.allowedFromApi]
 * @param {boolean} [options.workerMode]
 */
export function getNextFulfillmentStatuses(current, options = {}) {
  const { allowedFromApi, workerMode } = options;
  let candidates = [];

  if (allowedFromApi?.length) {
    candidates = allowedFromApi.filter((t) => canFulfillmentTransition(current, t) || t === "Cancelled");
  } else {
    const forward = getForwardFulfillmentStatus(current);
    if (forward) candidates.push(forward);
    if (canFulfillmentCancel(current)) candidates.push("Cancelled");
  }

  if (workerMode) {
    candidates = candidates.filter((s) => s !== "Cancelled");
  }

  const seen = new Set();
  return candidates.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}

/**
 * @param {object | null | undefined} order
 * @param {Array<{ status?: string }>} [fulfillments]
 * @param {{ canCreateFulfillment?: boolean; hasActiveFulfillment?: boolean } | null} [workflow]
 */
export function canCreateFulfillment(order, fulfillments = [], workflow = null) {
  if (workflow?.canCreateFulfillment === false) return false;
  if (workflow?.canCreateFulfillment === true) return true;

  const status = order?.orderStatus ?? order?.status;
  if (!status || ORDER_BLOCKED_CREATE.has(status)) return false;
  if (!ORDER_CREATE_ALLOWED.has(status)) return false;

  const hasActive =
    workflow?.hasActiveFulfillment === true ||
    fulfillments.some((f) => isActiveFulfillmentStatus(f.status));
  return !hasActive;
}

/**
 * @param {object | null | undefined} order
 * @param {{ warnings?: string[] } | null} [workflow]
 * @returns {string[]}
 */
export function getB2bPaymentWarnings(order, workflow = null) {
  const fromApi = workflow?.warnings ?? order?.workflow?.warnings;
  if (Array.isArray(fromApi) && fromApi.length > 0) return fromApi;

  const payment = order?.paymentStatus;
  const customerType = order?.customer?.customerType ?? order?.customerType;
  if (
    String(customerType).toUpperCase() === "B2B" &&
    (payment === "Unpaid" || payment === "PartiallyPaid" || payment === "UnPaid")
  ) {
    return ["Đơn B2B chưa thanh toán đủ — vẫn có thể xuất kho theo chính sách giao trước, thu sau."];
  }
  return [];
}

/** @returns {string | null} */
export function getB2bPaymentWarning(order, workflow = null) {
  const warnings = getB2bPaymentWarnings(order, workflow);
  return warnings[0] ?? null;
}
