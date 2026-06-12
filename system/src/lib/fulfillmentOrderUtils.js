/**
 * @param {Record<string, unknown> | null | undefined} obj
 * @param {string} camel
 * @param {string} pascal
 */
function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/**
 * @typedef {object} FulfillmentOrderLineView
 * @property {number} id
 * @property {string} sku
 * @property {string} productName
 * @property {string} variantName
 * @property {string | null} imageUrl
 * @property {number} quantity
 * @property {number | null} [priceSnapshot]
 * @property {number | null} [subTotal]
 */

/**
 * @param {unknown} line
 * @returns {FulfillmentOrderLineView | null}
 */
export function normalizeFulfillmentOrderLine(line) {
  if (!line || typeof line !== "object") return null;
  const l = /** @type {Record<string, unknown>} */ (line);
  const id = Number(pick(l, "id", "Id"));
  if (!Number.isFinite(id)) return null;
  const sku = String(pick(l, "currentSku", "CurrentSku") ?? pick(l, "skuSnapshot", "SkuSnapshot") ?? "").trim();
  const qty = Number(pick(l, "quantity", "Quantity"));
  const price = pick(l, "priceSnapshot", "PriceSnapshot");
  const sub = pick(l, "subTotal", "SubTotal");
  return {
    id,
    sku: sku || "—",
    productName: String(pick(l, "productName", "ProductName") ?? "—"),
    variantName: String(pick(l, "variantName", "VariantName") ?? ""),
    imageUrl: pick(l, "imageUrl", "ImageUrl") != null ? String(pick(l, "imageUrl", "ImageUrl")) : null,
    quantity: Number.isFinite(qty) ? qty : 0,
    priceSnapshot: price != null && Number.isFinite(Number(price)) ? Number(price) : null,
    subTotal: sub != null && Number.isFinite(Number(sub)) ? Number(sub) : null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} orderObj
 * @returns {FulfillmentOrderLineView[]}
 */
export function getFulfillmentOrderLines(orderObj) {
  if (!orderObj) return [];
  const raw = pick(orderObj, "lines", "Lines");
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeFulfillmentOrderLine).filter(Boolean);
}

/**
 * @param {Record<string, unknown> | null | undefined} orderObj
 */
export function getFulfillmentShippingAddress(orderObj) {
  if (!orderObj) return null;
  const addr = pick(orderObj, "shippingAddress", "ShippingAddress");
  if (!addr || typeof addr !== "object") return null;
  const a = /** @type {Record<string, unknown>} */ (addr);
  return {
    receiverName: String(pick(a, "receiverName", "ReceiverName") ?? ""),
    receiverPhone: String(pick(a, "receiverPhone", "ReceiverPhone") ?? ""),
    addressLine: String(pick(a, "addressLine", "AddressLine") ?? ""),
  };
}

/**
 * @param {FulfillmentOrderLineView[]} lines
 */
export function sumFulfillmentLineQuantity(lines) {
  return lines.reduce((sum, l) => sum + (l.quantity || 0), 0);
}
