import { STORE_SORT_DEFAULT, STORE_SORT_OPTIONS } from '../../../data/storeCatalogSort'

/**
 * Sắp xếp (đồng bộ BE `sort`).
 *
 * @param {object} props
 * @param {string} [props.sort]
 * @param {(sortId: string) => void} props.onSortChange
 * @param {number} [props.totalProducts]
 */
export function SortBar({
  sort = STORE_SORT_DEFAULT,
  onSortChange,
  totalProducts = 0,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Sắp xếp:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {STORE_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSortChange(opt.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                sort === opt.id
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary/15 hover:text-primary dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
        Tìm thấy {totalProducts} sản phẩm
      </p>
    </div>
  )
}
