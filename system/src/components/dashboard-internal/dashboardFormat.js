/** Định dạng VND (số nguyên, không decimal nhỏ). */
export function formatVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

/** Tỷ lệ 0–1 → % (vd 0.0547). */
export function formatRate01(n, digits = 2) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${(Number(n) * 100).toFixed(digits).replace(".", ",")}%`;
}

export function formatInt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

export function formatDecimal(n, digits = 1) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

/**
 * Mặc định 30 ngày gần nhất (theo `dashboard-implement.md` §3.1).
 * @returns {{ fromDate: string; toDate: string }} YYYY-MM-DD
 */
export function defaultDateRange30d() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { fromDate: toYmd(from), toDate: toYmd(to) };
}

export function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
