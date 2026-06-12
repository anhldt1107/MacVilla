/** @param {unknown} detail */
export function getWarrantyTicketLines(detail) {
  if (!detail || typeof detail !== "object") return [];
  const d = /** @type {Record<string, unknown>} */ (detail);
  const raw = d.lines ?? d.Lines;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const o = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
      const orderItemId = o.orderItemId ?? o.OrderItemId;
      const variantId = o.variantId ?? o.VariantId;
      if (orderItemId == null || variantId == null) return null;
      return {
        id: o.id ?? o.Id,
        orderItemId: Number(orderItemId),
        variantId: Number(variantId),
        sku: String(o.sku ?? o.Sku ?? ""),
        variantName: String(o.variantName ?? o.VariantName ?? ""),
        productName: String(o.productName ?? o.ProductName ?? ""),
        variantImageUrl: o.variantImageUrl ?? o.VariantImageUrl ?? null,
        imageUrl: o.imageUrl ?? o.ImageUrl ?? null,
        quantity: Number(o.quantity ?? o.Quantity ?? 1),
        warrantyPeriodMonths: Number(o.warrantyPeriodMonths ?? o.WarrantyPeriodMonths ?? 12),
        validUntil: o.validUntil ?? o.ValidUntil,
        isValid: o.isValid === true || o.IsValid === true,
        daysRemaining: o.daysRemaining ?? o.DaysRemaining,
        activeClaimId:
          o.activeClaimId != null
            ? Number(o.activeClaimId)
            : o.ActiveClaimId != null
              ? Number(o.ActiveClaimId)
              : null,
      };
    })
    .filter(Boolean);
}

/** @param {{ isValid?: boolean, activeClaimId?: number | null }} line */
export function warrantyLineCanCreateClaim(line) {
  if (line?.activeClaimId != null && Number.isFinite(Number(line.activeClaimId))) return false;
  return line?.isValid === true;
}

/** @param {{ sku?: string, variantName?: string, productName?: string, quantity?: number, warrantyPeriodMonths?: number, isValid?: boolean, daysRemaining?: number | null }} line */
export function formatWarrantyLineLabel(line) {
  const name = line.variantName || line.productName || line.sku || "Sản phẩm";
  const sku = line.sku && name !== line.sku ? ` (${line.sku})` : "";
  const qty = line.quantity > 1 ? ` ×${line.quantity}` : "";
  const months = line.warrantyPeriodMonths ? ` — ${line.warrantyPeriodMonths} tháng` : "";
  const status =
    line.isValid === false
      ? " [Hết hạn]"
      : line.daysRemaining != null && Number(line.daysRemaining) <= 30
        ? ` [Còn ${line.daysRemaining} ngày]`
        : "";
  return `${name}${sku}${qty}${months}${status}`;
}
