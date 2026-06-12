import { Icon } from '../../ui/Icon'
import { FOOTER_ABOUT } from '../../../data/footer'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../../lib/brand'

export function FooterAbout() {
  return (
    <div>
      <div className="flex items-center gap-2 text-primary mb-6">
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          className="h-10 w-auto max-w-[180px] object-contain object-left"
        />
      </div>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        {FOOTER_ABOUT}
      </p>
      <div className="flex gap-4">
        <a
          className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-colors"
          href="#"
          aria-label="Trang web"
        >
          <Icon name="public" className="text-lg" />
        </a>
        <a
          className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-colors"
          href="#"
          aria-label="Email"
        >
          <Icon name="mail" className="text-lg" />
        </a>
      </div>
    </div>
  )
}
