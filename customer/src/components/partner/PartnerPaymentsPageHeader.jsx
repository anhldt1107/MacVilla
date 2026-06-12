import { PartnerHeaderUser } from './PartnerHeaderUser'
import { PartnerPaymentsSubnav } from './PartnerPaymentsSubnav'

/**
 * Header đồng bộ với các trang partner (Orders, Payments).
 * @param {{ title: string, subtitle?: string, below?: import('react').ReactNode, paymentsNav?: boolean }} props
 */
export function PartnerPaymentsPageHeader({ title, subtitle, below, paymentsNav }) {
  const sub = subtitle?.trim()
  return (
    <header className="p-8 pb-0">
      <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">
        <div>
          <h2
            className={`text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 ${sub ? 'mb-2' : ''}`}
          >
            {title}
          </h2>
          {sub ? <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{sub}</p> : null}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <PartnerHeaderUser hideTextOnMobile={false} />
        </div>
      </div>
      {paymentsNav ? <PartnerPaymentsSubnav /> : null}
      {below}
    </header>
  )
}
