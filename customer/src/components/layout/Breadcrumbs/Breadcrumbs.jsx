import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'

/**
 * @param {Array<{ label: string, href: string | null }>} items
 */
export function Breadcrumbs({ items }) {
  return (
    <nav
      className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6"
      aria-label="Đường dẫn"
    >
      {items.map((item, index) => (
        <span
          key={`crumb-${index}-${item.label}`}
          className="flex items-center gap-2"
        >
          {index > 0 && (
            <Icon name="chevron_right" className="text-xs flex-shrink-0" />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-primary flex items-center gap-1"
            >
              {index === 0 && <Icon name="home" className="text-sm" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
