import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../../lib/brand'

const CUSTOMER_LINKS = [
  { label: 'Tra cứu bảo hành', href: '#' },
  { label: 'Hướng dẫn lắp đặt', href: '#' },
  { label: 'Trung tâm bảo hành', href: '#' },
  { label: 'Liên hệ', href: '#' },
]

const POLICY_LINKS = [
  { label: 'Chính sách bảo mật', href: '#' },
  { label: 'Điều khoản sử dụng', href: '#' },
  { label: 'Chính sách vận chuyển', href: '#' },
  { label: 'Đổi trả hàng', href: '#' },
]

export function ProductsFooter() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 mt-20 pt-16 pb-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2 mb-6"
              aria-label={BRAND_NAME}
            >
              <img
                src={BRAND_LOGO_SRC}
                alt=""
                className="h-10 w-auto max-w-[180px] object-contain"
              />
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Nhà cung cấp thiết bị nhà bếp hàng đầu tại Việt Nam. Mang công nghệ
              toàn cầu đến mọi gia đình từ năm 2010.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-slate-400">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              {CUSTOMER_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-slate-400">
              Chính sách
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              {POLICY_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-slate-400">
              Newsletter
            </h4>
            <p className="text-sm text-slate-500 mb-4">
              Đăng ký nhận ưu đãi và mẹo hay cho nhà bếp.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-primary"
                aria-label="Email đăng ký nhận tin"
              />
              <button
                type="button"
                className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
                aria-label="Đăng ký"
              >
                <Icon name="send" />
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2026 Macvilla. Bảo lưu mọi quyền.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-slate-400 hover:text-primary transition-colors"
              aria-label="Mạng xã hội"
            >
              <Icon name="social_leaderboard" />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-primary transition-colors"
              aria-label="YouTube"
            >
              <Icon name="youtube_activity" />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-primary transition-colors"
              aria-label="Ngôn ngữ"
            >
              <Icon name="language" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
