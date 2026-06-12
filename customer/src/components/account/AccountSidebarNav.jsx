import { NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const rowBase =
  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all'
const activeCls = 'bg-primary text-white shadow-md'
const idleCls =
  'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
const placeholderCls =
  'text-slate-400 dark:text-slate-500 cursor-default opacity-90'

/** @param {{ items: { icon: string, label: string, href: string }[] }} props */
export function AccountSidebarNav({ items }) {
  return (
    <>
      {items.map((item) => {
        const isPlaceholder =
          item.href === '#' ||
          item.href === '' ||
          (typeof item.href === 'string' && item.href.trim() === '#')

        if (isPlaceholder) {
          return (
            <div
              key={item.label}
              className={`${rowBase} ${placeholderCls}`}
              title="Đang phát triển"
            >
              <Icon name={item.icon} className="text-xl" />
              <span className="font-medium">{item.label}</span>
            </div>
          )
        }

        return (
          <NavLink
            key={item.label}
            to={item.href}
            end={item.href === '/account'}
            className={({ isActive }) =>
              `${rowBase} ${isActive ? activeCls : idleCls}`
            }
          >
            <Icon name={item.icon} className="text-xl" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        )
      })}
    </>
  )
}
