/**
 * Gợi ý slug ASCII từ tên (không dấu, dấu gạch).
 * @param {string} name
 */
export function suggestSlugFromName(name) {
  const s = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "";
}
