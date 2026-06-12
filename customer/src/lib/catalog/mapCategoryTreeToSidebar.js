/**
 * Icon gợi ý theo slug/tên (fallback luân phiên).
 * @type {string[]}
 */
const TOP_LEVEL_ICONS = [
  'shower',
  'cooking',
  'water_drop',
  'solar_power',
  'home_iot_device',
  'kitchen',
  'category',
]

/**
 * @param {{ slug?: string, name?: string }} node
 * @param {number} rootIndex
 */
function iconForRootNode(node, rootIndex) {
  const s = `${node.slug || ''} ${node.name || ''}`.toLowerCase()
  if (/(bếp|bep|kitchen|cook)/.test(s)) return 'cooking'
  if (/(vệ sinh|vesinh|toilet|lavabo|tắm|tam|shower|wc)/.test(s)) {
    return 'shower'
  }
  if (/(lọc|loc|water|nước)/.test(s)) return 'water_drop'
  if (/(năng lượng|mat troi|solar)/.test(s)) return 'solar_power'
  if (/(smart|iot|điện|dien)/.test(s)) return 'home_iot_device'
  return TOP_LEVEL_ICONS[rootIndex % TOP_LEVEL_ICONS.length]
}

/**
 * Map một node con (đệ quy) cho flyout — giữ toàn bộ cây phía trong.
 * @param {unknown} node
 * @returns {{ label: string, to: string, children?: ReturnType<typeof mapChildNode>[]} | null}
 */
function mapChildNode(node) {
  if (
    !node ||
    typeof node !== 'object' ||
    typeof node.id !== 'number' ||
    typeof node.name !== 'string'
  ) {
    return null
  }
  const to = `/products?categoryId=${node.id}`
  const rawChildren = Array.isArray(node.children) ? node.children : []
  const mappedKids = rawChildren
    .map(mapChildNode)
    .filter((x) => x != null)

  return {
    label: node.name,
    to,
    ...(mappedKids.length > 0 ? { children: mappedKids } : {}),
  }
}

/**
 * Chuyển node gốc BE → props NavItem.
 * @param {{ id: number, name: string, slug?: string, children?: unknown[] }} node
 * @param {number} rootIndex
 */
export function mapCategoryNodeToNavItem(node, rootIndex) {
  const to = `/products?categoryId=${node.id}`
  const rawChildren = Array.isArray(node.children) ? node.children : []
  const children =
    rawChildren.length > 0
      ? rawChildren.map(mapChildNode).filter((x) => x != null)
      : null

  return {
    id: `cat-${node.id}`,
    icon: iconForRootNode(node, rootIndex),
    label: node.name,
    to,
    children: children && children.length > 0 ? children : null,
  }
}

/**
 * @param {unknown[] | null | undefined} tree
 */
export function mapCategoryTreeToSidebarItems(tree) {
  if (!tree || !Array.isArray(tree) || tree.length === 0) return []
  return tree
    .filter(
      (n) =>
        n &&
        typeof n === 'object' &&
        typeof n.id === 'number' &&
        typeof n.name === 'string'
    )
    .map((node, index) => mapCategoryNodeToNavItem(node, index))
}
