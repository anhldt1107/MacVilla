/**
 * Single filter group (checkbox list or button list)
 */
export function FilterGroup({
  title,
  type = 'checkbox',
  options,
  selectedIds = [],
  onToggle,
}) {
  return (
    <div className={type === 'checkbox' ? 'mb-6' : 'mb-6'}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
        {title}
      </p>
      <div className="space-y-2">
        {options.map((opt) => {
          const isChecked = selectedIds.includes(opt.id)
          if (type === 'button') {
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle?.(opt.id)}
                className={`w-full text-left px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isChecked
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {opt.label}
              </button>
            )
          }
          return (
            <label
              key={opt.id}
              className="flex items-center gap-2 text-sm cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle?.(opt.id)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="group-hover:text-primary transition-colors">
                {opt.label}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
