import { FooterAbout } from './FooterAbout'
import { FooterPolicies } from './FooterPolicies'
import { FooterSupport } from './FooterSupport'
import { FooterBadges } from './FooterBadges'

const COPYRIGHT = '© 2026 Macvilla. Bảo lưu mọi quyền. Thiết kế vì sự hoàn hảo.'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-20 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <FooterAbout />
          <FooterPolicies />
          <FooterSupport />
          <FooterBadges />
        </div>
        <div className="mt-16 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400">
          {COPYRIGHT}
        </div>
      </div>
    </footer>
  )
}
