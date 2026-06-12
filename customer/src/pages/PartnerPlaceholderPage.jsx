import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerHeaderUser } from '../components/partner/PartnerHeaderUser'

/** Trang giữ chỗ cho màn B2B đang hoàn thiện. */
export function PartnerPlaceholderPage({ title, description }) {
  return (
    <>
      <header className="p-8 pb-0">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-slate-50">
              {title}
            </h2>
            {description ? (
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{description}</p>
            ) : null}
          </div>
          <PartnerHeaderUser hideTextOnMobile={false} />
        </div>
      </header>
      <div className="p-8 pt-4 flex-1">
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/40 p-8 text-center max-w-xl mx-auto">
          <Icon name="construction" className="text-5xl text-slate-400 mb-4 inline-block" />
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Đang làm · sẽ bổ sung sau.</p>
          <Link
            to="/partner/dashboard"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <Icon name="arrow_back" className="text-lg" />
            Về Dashboard
          </Link>
        </div>
      </div>
    </>
  )
}
