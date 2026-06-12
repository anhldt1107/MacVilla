/**
 * Tổng số lượng sản phẩm trong giỏ (cộng quantity từng dòng).
 * @param {unknown} dto — StoreCartDto hoặc tương thích (có `lines`).
 * @returns {number}
 */
export function countCartLineQuantity(dto) {
  const lines = dto && typeof dto === 'object' ? dto.lines : null
  if (!Array.isArray(lines)) return 0
  return lines.reduce((sum, line) => {
    if (!line || typeof line !== 'object') return sum
    const q = line.quantity != null ? Number(line.quantity) : 0
    return sum + (Number.isFinite(q) && q > 0 ? Math.floor(q) : 0)
  }, 0)
}
