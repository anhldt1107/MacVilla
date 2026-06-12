/**
 * URL chi tiết phiếu công việc theo shell staff.
 * @param {{ fulfillmentsList: string | null; shell?: string }} paths
 * @param {number | string | null | undefined} fulfillmentId
 * @returns {string | null}
 */
export function staffFulfillmentDetailHref(paths, fulfillmentId) {
  if (!paths?.fulfillmentsList) return null;
  const id = Number(fulfillmentId);
  if (!Number.isFinite(id) || id < 1) return null;
  return `${paths.fulfillmentsList}/${encodeURIComponent(String(id))}`;
}

/**
 * Prefix route đơn hàng theo shell (worker không có trang chi tiết đơn).
 * @param {{ shell?: string; ordersList?: string }} paths
 * @returns {string | null}
 */
export function staffOrderPathPrefixForFulfillment(paths) {
  if (paths?.shell === "worker") return null;
  return paths?.ordersList ?? null;
}
