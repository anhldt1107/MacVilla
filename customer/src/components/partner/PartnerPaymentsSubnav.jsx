import { Link, useLocation } from 'react-router-dom'

const ITEMS = [
  { href: '/partner/payments/debt', label: 'Công nợ', prefix: '/partner/payments/debt' },
  { href: '/partner/payments/invoices', label: 'Hóa đơn', prefix: '/partner/payments/invoices' },
  { href: '/partner/payments/pay', label: 'Thanh toán', prefix: '/partner/payments/pay' },
  { href: '/partner/payments/upload', label: 'Báo CK', prefix: '/partner/payments/upload' },
  { href: '/partner/payments/history', label: 'Lịch sử', prefix: '/partner/payments/history' },
]

function isActivePath(pathname, prefix) {
  if (pathname === prefix) return true
  return prefix !== '/partner/payments/debt' && pathname.startsWith(`${prefix}/`)
}

/**
 * Luồng ngắn: Công nợ → Hóa đơn → Chi tiết → Thanh toán / Báo CK / Lịch sử.
 */
export function PartnerPaymentsSubnav() {
  const { pathname } = useLocation()
  return (
    <nav
      className="flex flex-wrap gap-2 mb-5"
      aria-label="Mục tài chính đối tác"
    >
      {ITEMS.map(({ href, label, prefix }) => {
        const on = isActivePath(pathname, prefix)
        return (
          <Link
            key={href}
            to={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              on
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
