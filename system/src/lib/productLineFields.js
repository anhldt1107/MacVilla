/** @param {Record<string, unknown> | null | undefined} obj */
export function pickObjField(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] != null && obj[camel] !== "") return obj[camel];
  if (obj[pascal] != null && obj[pascal] !== "") return obj[pascal];
  return undefined;
}

/** @param {Record<string, unknown> | null | undefined} row */
export function extractProductLineFields(row) {
  const o = row && typeof row === "object" ? row : {};
  return {
    productName: pickObjField(o, "productName", "ProductName"),
    variantName: pickObjField(o, "variantName", "VariantName"),
    sku:
      pickObjField(o, "sku", "Sku") ??
      pickObjField(o, "currentSku", "CurrentSku") ??
      pickObjField(o, "skuSnapshot", "SkuSnapshot"),
    imageUrl: pickObjField(o, "imageUrl", "ImageUrl"),
    variantImageUrl: pickObjField(o, "variantImageUrl", "VariantImageUrl"),
    variantId: pickObjField(o, "variantId", "VariantId"),
  };
}

/** @param {Record<string, unknown> | null | undefined} row @param {"returned"|"exchanged"} side */
export function extractReturnSideFields(row, side) {
  const suffix = side === "exchanged" ? "Exchanged" : "Returned";
  const o = row && typeof row === "object" ? row : {};
  return {
    productName: pickObjField(o, `productName${suffix}`, `ProductName${suffix}`),
    variantName: pickObjField(o, `variantName${suffix}`, `VariantName${suffix}`),
    sku: pickObjField(o, `sku${suffix}`, `Sku${suffix}`),
    imageUrl: pickObjField(o, `imageUrl${suffix}`, `ImageUrl${suffix}`),
    variantId: pickObjField(o, `variantId${suffix}`, `VariantId${suffix}`),
  };
}

/** @param {{ productName?: unknown, variantName?: unknown, sku?: unknown, variantId?: unknown }} fields */
export function formatProductLineTitle(fields) {
  const primary = fields.variantName || fields.productName;
  if (primary) return String(primary);
  if (fields.sku) return String(fields.sku);
  if (fields.variantId != null) return `Biến thể #${fields.variantId}`;
  return "—";
}
