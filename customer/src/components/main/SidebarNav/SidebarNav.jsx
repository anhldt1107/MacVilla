import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavItem } from './NavItem'
import { Icon } from '../../ui/Icon'
import { SIDEBAR_NAV } from '../../../data/navigation'
import { storeFetchCategoryTree } from '../../../api/store/storeCatalogApi'
import { mapCategoryTreeToSidebarItems } from '../../../lib/catalog/mapCategoryTreeToSidebar'

/** Chiều cao tối thiểu mỗi dòng danh mục (compact, không scroll). */
const COMPACT_ROW_MIN_PX = 34

/**
 * @param {number} stackHeight
 * @param {number} headerHeight
 * @param {number} footerHeight
 * @param {number} totalItems
 */
function computeVisibleCategoryCount(stackHeight, headerHeight, footerHeight, totalItems) {
  if (totalItems <= 0) return 0
  const available = stackHeight - headerHeight - footerHeight
  if (available <= 0) return 1
  const count = Math.floor(available / COMPACT_ROW_MIN_PX)
  return Math.max(1, Math.min(totalItems, count))
}

/**
 * @param {{ className?: string, compact?: boolean, stackHeight?: number | null }} [props]
 */
export function SidebarNav({ className = '', compact = false, stackHeight = null }) {
  const [tree, setTree] = useState(null)
  const [loadState, setLoadState] = useState('loading')
  const headerRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const footerRef = useRef(/** @type {HTMLAnchorElement | null} */ (null))
  const [visibleCount, setVisibleCount] = useState(/** @type {number | null} */ (null))

  useEffect(() => {
    let cancelled = false
    storeFetchCategoryTree()
      .then((data) => {
        if (cancelled) return
        setTree(Array.isArray(data) ? data : [])
        setLoadState('success')
      })
      .catch(() => {
        if (cancelled) return
        setTree(null)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(() => {
    const mapped = mapCategoryTreeToSidebarItems(tree)
    if (mapped.length > 0) return mapped
    if (loadState === 'loading') return []
    return SIDEBAR_NAV.map((item) => ({
      ...item,
      to: '/products',
      children: item.children?.map((c) => ({
        label: c.label,
        to: c.href && c.href !== '#' ? c.href : '/products',
      })),
    }))
  }, [tree, loadState])

  useLayoutEffect(() => {
    if (!compact || stackHeight == null) {
      setVisibleCount(items.length)
      return
    }
    const headerH = headerRef.current?.offsetHeight ?? 32
    const footerH = footerRef.current?.offsetHeight ?? 40
    setVisibleCount(computeVisibleCategoryCount(stackHeight, headerH, footerH, items.length))
  }, [compact, stackHeight, items.length])

  const effectiveVisibleCount = useMemo(() => {
    if (!compact || stackHeight == null) return items.length
    if (visibleCount != null) return visibleCount
    return computeVisibleCategoryCount(stackHeight, 32, 40, items.length)
  }, [compact, stackHeight, visibleCount, items.length])

  const visibleItems = useMemo(
    () => items.slice(0, effectiveVisibleCount),
    [items, effectiveVisibleCount]
  )

  const hiddenCount = Math.max(0, items.length - effectiveVisibleCount)
  const showMoreHint = hiddenCount > 0

  return (
    <aside
      className={`hidden lg:flex lg:flex-col w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible ${className}`}
    >
      <div
        ref={headerRef}
        className={`shrink-0 px-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 rounded-t-xl overflow-hidden ${
          compact ? 'py-1.5' : 'py-2'
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Danh mục sản phẩm
        </p>
      </div>

      <nav className={`flex flex-col flex-1 min-h-0 ${compact ? '' : 'min-h-[120px]'}`}>
        {loadState === 'loading' && items.length === 0 ? (
          <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
            Đang tải danh mục…
          </div>
        ) : null}
        {visibleItems.map((item, index) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            to={item.to}
            children={item.children}
            isLast={index === visibleItems.length - 1}
            compact={compact}
            fillHeight={compact}
          />
        ))}
      </nav>

      {loadState === 'error' && items.length > 0 ? (
        <p className="shrink-0 px-4 py-1.5 text-[11px] text-amber-600 dark:text-amber-400 border-t border-slate-100 dark:border-slate-700">
          Không tải được danh mục
        </p>
      ) : null}

      {compact && items.length > 0 ? (
        <Link
          ref={footerRef}
          to="/products"
          className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 text-sm font-bold text-primary hover:bg-primary/5 transition-colors rounded-b-xl"
        >
          <span>Xem thêm{showMoreHint ? ` (${hiddenCount} danh mục)` : ''}</span>
          <Icon name="chevron_right" className="text-lg shrink-0" />
        </Link>
      ) : null}
    </aside>
  )
}
