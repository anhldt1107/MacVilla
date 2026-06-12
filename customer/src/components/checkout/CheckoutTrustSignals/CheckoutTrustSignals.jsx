import { Icon } from '../../ui/Icon'
import { CHECKOUT_TRUST } from '../../../data/checkout'

export function CheckoutTrustSignals() {
  return (
    <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/10">
      <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4">
        Cam kết từ Macvilla
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {CHECKOUT_TRUST.map((item) => (
          <div key={item.icon} className="flex items-start gap-3">
            <Icon
              name={item.icon}
              className="text-primary text-xl flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
