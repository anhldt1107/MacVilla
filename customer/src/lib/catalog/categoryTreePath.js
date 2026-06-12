/**
 * DFS tìm đường từ gốc tới node có id = targetId.
 * @param {unknown} nodes
 * @param {number} targetId
 * @param {Array<{ id: number, name: string, slug?: string }>} [pathAcc]
 * @returns {Array<{ id: number, name: string, slug?: string }> | null}
 */
export function findCategoryPathById(nodes, targetId, pathAcc = []) {
  if (!Array.isArray(nodes)) return null
  for (const node of nodes) {
    if (!node || typeof node !== 'object' || typeof node.id !== 'number') continue
    const name =
      typeof node.name === 'string' ? node.name : String(node.id)
    const step = {
      id: node.id,
      name,
      slug: typeof node.slug === 'string' ? node.slug : undefined,
    }
    const nextPath = [...pathAcc, step]
    if (node.id === targetId) return nextPath
    const children = node.children
    if (Array.isArray(children) && children.length > 0) {
      const found = findCategoryPathById(children, targetId, nextPath)
      if (found) return found
    }
  }
  return null
}
