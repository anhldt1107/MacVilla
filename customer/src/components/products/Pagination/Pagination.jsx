import { Icon } from '../../ui/Icon'

/**
 * @param {{ current: number, total: number, onPageChange?: (page: number) => void }} props
 */
export function Pagination({ current = 1, total = 8, onPageChange }) {
  const pages = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('ellipsis')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i)
    if (current < total - 2) pages.push('ellipsis')
    if (total > 1) pages.push(total)
  }

  return (
    <div className="mt-12 flex justify-center">
      <nav
        className="flex items-center gap-1"
        aria-label="Phân trang"
      >
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onPageChange?.(current - 1)}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
          aria-label="Trang trước"
        >
          <Icon name="chevron_left" />
        </button>
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange?.(page)}
              className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                page === current
                  ? 'bg-primary text-white'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              aria-label={`Trang ${page}`}
              aria-current={page === current ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          disabled={current >= total}
          onClick={() => onPageChange?.(current + 1)}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
          aria-label="Trang sau"
        >
          <Icon name="chevron_right" />
        </button>
      </nav>
    </div>
  )
}
