/** @typedef {'pdf' | 'word' | 'unknown'} DocumentKind */

const PDF_EXT = /\.pdf(\?|#|$)/i;
const WORD_EXT = /\.(doc|docx)(\?|#|$)/i;

/**
 * @param {string | null | undefined} url
 * @returns {DocumentKind}
 */
export function detectDocumentKind(url) {
  const t = String(url ?? "").trim();
  if (!t) return "unknown";
  try {
    const path = new URL(t, "https://placeholder.local").pathname.toLowerCase();
    if (PDF_EXT.test(path) || path.endsWith(".pdf")) return "pdf";
    if (WORD_EXT.test(path) || /\.docx?$/.test(path)) return "word";
  } catch {
    const lower = t.toLowerCase();
    if (lower.includes(".pdf")) return "pdf";
    if (lower.includes(".docx") || lower.includes(".doc")) return "word";
  }
  return "unknown";
}

/**
 * @param {string | null | undefined} url
 */
export function documentDisplayName(url) {
  const t = String(url ?? "").trim();
  if (!t) return "Tài liệu";
  try {
    const path = new URL(t).pathname;
    const segment = path.split("/").filter(Boolean).pop() ?? "";
    const decoded = decodeURIComponent(segment);
    if (decoded) return decoded;
  } catch {
    const parts = t.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) {
      try {
        return decodeURIComponent(last.split("?")[0]);
      } catch {
        return last.split("?")[0];
      }
    }
  }
  return "Tài liệu";
}

/**
 * @param {DocumentKind} kind
 */
export function isPreviewableInBrowser(kind) {
  return kind === "pdf";
}

/**
 * @param {DocumentKind} kind
 */
export function documentOpenLinkLabel(kind) {
  if (kind === "pdf") return "Xem PDF";
  if (kind === "word") return "Tải Word";
  return "Mở tệp";
}
