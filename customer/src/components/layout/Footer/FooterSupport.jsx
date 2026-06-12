import { Icon } from '../../ui/Icon'
import { CONTACT } from '../../../data/footer'

export function FooterSupport() {
  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-sm tracking-widest">
        Hỗ Trợ Khách Hàng
      </h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Icon name="call" className="text-primary" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {CONTACT.hotlineLabel}
            </p>
            <p className="text-lg font-black text-secondary">
              {CONTACT.hotline}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="support_agent" className="text-primary" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {CONTACT.techLabel}
            </p>
            <p className="text-sm font-bold">{CONTACT.tech}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
