import { Icon } from '../../ui/Icon'

export function StoreServices({ items = [], embedded = false }) {
  if (!items?.length) return null

  const shell = embedded
    ? 'border-t border-slate-100 dark:border-slate-800 pt-5 mt-1'
    : 'bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm'
  const title = embedded
    ? 'text-base font-bold mb-3 text-slate-900 dark:text-slate-100'
    : 'text-lg font-bold mb-4'

  return (
    <section className={shell}>
      <h3 className={title}>Dịch vụ cửa hàng</h3>
      <div className={embedded ? 'space-y-3' : 'space-y-4'}>
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <Icon
              name={item.icon}
              className={`${item.iconColor ?? 'text-primary'} mt-0.5`}
            />
            <div>
              <p className="text-sm font-bold">{item.title}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
