import { Icon } from '../../ui/Icon'
import { PAYMENT_METHODS } from '../../../data/checkout'

const defaultId = PAYMENT_METHODS.find((p) => p.defaultChecked)?.id ?? PAYMENT_METHODS[0].id

export function PaymentMethods({ value = defaultId, onChange }) {
  const selected = value
  const setSelected = (id) => onChange?.(id)

  if (PAYMENT_METHODS.length === 1) {
    const method = PAYMENT_METHODS[0]
    return (
      <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-6 text-primary">
          <Icon name="payments" className="text-2xl" />
          <h2 className="text-xl font-bold tracking-tight">
            Phương thức thanh toán
          </h2>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-primary bg-primary/5 p-4 dark:bg-primary/10">
          <div className="flex items-center gap-4 min-w-0">
            <Icon name={method.icon} className="text-primary text-2xl shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {method.title}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {method.description}
              </span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-6 text-primary">
        <Icon name="payments" className="text-2xl" />
        <h2 className="text-xl font-bold tracking-tight">
          Phương thức thanh toán
        </h2>
      </div>
      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selected === method.id
          return (
            <label
              key={method.id}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  name={method.name}
                  value={method.id}
                  checked={isSelected}
                  onChange={() => setSelected(method.id)}
                  className="text-primary focus:ring-primary border-slate-300"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {method.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {method.description}
                  </span>
                </div>
              </div>
              {method.icon === 'momo' && method.badge ? (
                <div className="w-6 h-6 rounded bg-[#A50064] flex items-center justify-center text-[8px] text-white font-black">
                  {method.badge}
                </div>
              ) : (
                <Icon
                  name={method.icon}
                  className={isSelected ? 'text-primary text-2xl' : 'text-slate-400 text-2xl'}
                />
              )}
            </label>
          )
        })}
      </div>
    </section>
  )
}
