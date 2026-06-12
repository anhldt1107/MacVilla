import { canCreateFulfillment, isActiveFulfillmentStatus } from "@/lib/orderFulfillmentRules";
import { fetchAdminFulfillments } from "@/services/admin/adminFulfillmentsApi";
import { fetchAdminOrders } from "@/services/admin/adminOrdersApi";

/**
 * Đơn Confirmed chưa có phiếu xuất đang active.
 * @param {import("@/services/admin/adminOrdersApi").AdminOrderListItem[]} orders
 * @param {import("@/services/admin/adminFulfillmentsApi").AdminFulfillmentListItem[]} fulfillments
 */
export function filterOrdersEligibleForFulfillment(orders, fulfillments) {
  const busyOrderIds = new Set(
    (fulfillments ?? [])
      .filter((f) => isActiveFulfillmentStatus(f.status))
      .map((f) => f.orderId)
  );
  return (orders ?? []).filter((o) => canCreateFulfillment(o) && !busyOrderIds.has(o.id));
}

/**
 * @param {string} accessToken
 */
export async function countOrdersEligibleForFulfillment(accessToken) {
  const [ordersResult, fulfillmentsResult] = await Promise.all([
    fetchAdminOrders(accessToken, { page: 1, pageSize: 200, orderStatus: "Confirmed" }),
    fetchAdminFulfillments(accessToken, { page: 1, pageSize: 200 }),
  ]);
  return filterOrdersEligibleForFulfillment(ordersResult.items, fulfillmentsResult.items).length;
}
