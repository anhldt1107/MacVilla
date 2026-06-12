import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../../lib/brand'

const NAV_LINKS = [
  { label: 'Nhà bếp', href: '#' },
  { label: 'Thiết bị', href: '#' },
  { label: 'Ưu đãi', href: '#' },
]

const CART_COUNT = 3

export function ProductsHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
            aria-label={`${BRAND_NAME} - Trang chủ`}
          >
            <img
              src={BRAND_LOGO_SRC}
              alt=""
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          </Link>
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="Tìm thiết bị nhà bếp..."
                aria-label="Tìm kiếm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-6">
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative"
                aria-label="Giỏ hàng"
              >
                <Icon name="shopping_cart" />
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full">
                  {CART_COUNT}
                </span>
              </button>
              <button
                type="button"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                aria-label="Tài khoản"
              >
                <Icon name="person" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
