import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'

/**
 * @typedef {{ label: string, to?: string, children?: NavChild[] }} NavChild
 */

/**
 * Một dòng trong flyout; nếu có children — hover hiện thêm cột bên phải (đệ quy).
 * @param {{ item: NavChild }} props
 */
function FlyoutRow({ item }) {
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren) {
    return (
      <Link
        to={item.to ?? '/products'}
        className="block px-4 py-2.5 hover:bg-primary/5 hover:text-primary font-medium text-sm text-slate-800 dark:text-slate-100"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div className="group/sub relative">
      {/* Hàng có con: vùng hover = cả nhãn + vùng nối sang menu con */}
      <div className="flex items-stretch">
        <Link
          to={item.to ?? '/products'}
          className="flex-1 px-4 py-2.5 hover:bg-primary/5 hover:text-primary font-medium text-sm text-slate-800 dark:text-slate-100 min-w-0"
        >
          {item.label}
        </Link>
        <div
          className="flex items-center pr-2 text-slate-400 shrink-0"
          aria-hidden
        >
          <Icon name="chevron_right" className="text-lg" />
        </div>
      </div>
      {/* Không đặt overflow-y-auto / max-h trên panel chứa submenu absolute — sẽ cắt cấp 3+ */}
      <div className="hidden group-hover/sub:block absolute left-full top-0 pl-1 z-[110]">
        <div className="min-w-[220px] overflow-visible bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-2">
          {item.children.map((child) => (
            <FlyoutRow
              key={`${child.to}-${child.label}`}
              item={child}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Danh mục sidebar: hover hàng cha → hiện cột con; con lồng nhau hiện thêm cột phải.
 * @param {{
 *   icon: string,
 *   label: string,
 *   to?: string,
 *   children?: NavChild[],
 *   isLast?: boolean,
 *   compact?: boolean,
 *   fillHeight?: boolean,
 * }} props
 */
export function NavItem({
  icon,
  label,
  children,
  isLast = false,
  to = '/products',
  compact = false,
  fillHeight = false,
}) {
  const hasChildren = children && children.length > 0

  const rowPadding = fillHeight
    ? 'flex-1 flex items-center min-h-[2rem] py-1'
    : compact
      ? 'py-2'
      : 'py-3'

  return (
    <div
      className={`group/nav relative px-4 hover:bg-primary/10 transition-colors ${rowPadding} ${
        isLast ? '' : 'border-b border-slate-100 dark:border-slate-700'
      }`}
    >
      <Link
        to={to}
        className={`flex items-center justify-between cursor-pointer gap-2 w-full ${
          fillHeight ? 'min-h-0' : ''
        }`}
      >
        <div className={`flex items-center min-w-0 ${compact ? 'gap-2' : 'gap-3'}`}>
          <Icon
            name={icon}
            className={`text-primary shrink-0 ${compact ? 'text-[20px]' : ''}`}
          />
          <span className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
            {label}
          </span>
        </div>
        {hasChildren ? (
          <Icon name="chevron_right" className="text-slate-400 shrink-0" />
        ) : null}
      </Link>
      {hasChildren ? (
        <div className="hidden group-hover/nav:block absolute left-full top-0 pl-2 z-[100]">
          <div className="w-64 overflow-visible bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-r-xl py-2">
            {children.map((item) => (
              <FlyoutRow
                key={`${item.to}-${item.label}`}
                item={item}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
