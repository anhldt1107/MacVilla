import { Icon } from '../../ui/Icon'

function formatPrice(value) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export function ComboPromo({ title = 'Mua kèm giảm giá', items = [] }) {
  if (!items || items.length === 0) return null
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="sell" className="text-primary" />
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-primary/50 cursor-pointer transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <img
                src={item.image}
                alt={item.imageAlt}
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.subtitle}</p>
              </div>
            </div>
            <span className="text-primary font-bold">
              +{formatPrice(item.addPrice)}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
