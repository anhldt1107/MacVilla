const viIntFmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/**
 * Parse chuỗi ô nhập VNĐ (có dấu phân hàng) → số nguyên. Chuỗi rỗng → NaN.
 * @param {string | number | null | undefined} value
 */
export function parseVndMoneyInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits === "") return NaN;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Format số hoặc chuỗi đang gõ thành dạng hiển thị vn-VN (không hậu tố đ).
 * @param {string | number | null | undefined} value
 */
export function formatVndMoneyInput(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const digits = value.replace(/\D/g, "");
    if (digits === "") return "";
    const n = parseInt(digits, 10);
    if (!Number.isFinite(n)) return "";
    return viIntFmt.format(n);
  }
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return "";
  return viIntFmt.format(n);
}
