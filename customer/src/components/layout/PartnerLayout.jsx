import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { B2B_SIDEBAR_NAV } from '../../data/b2bDashboard'
import { useAuth } from '../../contexts/AuthContext'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../lib/brand'
import { CustomerAssistantFab } from '../ai/CustomerAssistantFab'
import { NotificationBell } from '../notifications/NotificationBell'

function isChildActive(pathname, childHref) {
  if (childHref === '/partner/dashboard') return pathname === '/partner' || pathname === '/partner/dashboard'
  if (childHref === '/partner/company') {
    // Chỉ trang hồ sơ — không dùng prefix (tránh sáng cùng lúc với /company/addresses).
    return pathname === '/partner/company' || pathname === '/partner/company/'
  }
  if (childHref === '/partner/company/addresses') {
    return (
      pathname === '/partner/company/addresses' ||
      pathname.startsWith('/partner/company/addresses/')
    )
  }
  if (childHref === '/partner/contracts') {
    return (
      pathname === '/partner/contracts' ||
      pathname.startsWith('/partner/contracts/')
    )
  }
  if (childHref === '/partner/quotation/history') {
    if (pathname === '/partner/quotation/history') return true
    if (pathname.startsWith('/partner/quotation/') && pathname !== '/partner/quotation/create') return true
    return false
  }
  if (childHref === '/partner/quotation/create') {
    return pathname === '/partner/quotation/create'
  }
  if (childHref === '/partner/payments/invoices') {
    return (
      pathname === '/partner/payments/invoices' ||
      pathname.startsWith('/partner/payments/invoices/')
    )
  }
  if (childHref === '/partner/payments/debt') {
    return pathname.startsWith('/partner/payments')
  }
  if (childHref === '/partner/after-sales/returns') {
    return (
      pathname === '/partner/after-sales/returns' ||
      pathname.startsWith('/partner/after-sales/returns/')
    )
  }
  if (childHref === '/partner/after-sales/warranty') {
    return (
      pathname === '/partner/after-sales/warranty' ||
      pathname.startsWith('/partner/after-sales/warranty/')
    )
  }
  return pathname === childHref
}

function isSectionLinkActive(pathname, section) {
  if (!section.href) return false
  if (section.href === '/partner/dashboard') return pathname === '/partner' || pathname === '/partner/dashboard'
  if (section.href === '/partner/orders') return pathname.startsWith('/partner/orders')
  if (section.href === '/partner/payments/debt') return pathname.startsWith('/partner/payments')
  return pathname === section.href
}

export function PartnerLayout() {
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [openId, setOpenId] = useState(/** @type {string | null} */ (null))

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const section = B2B_SIDEBAR_NAV.find(
      (s) => s.children?.length > 0 && s.children.some((c) => isChildActive(pathname, c.href)),
    )
    queueMicrotask(() => {
      // Luôn đồng bộ accordion với route: nếu đang xem Đơn hàng/Dashboard...
      // mà accordion Hợp đồng vẫn "mở" (isOpen) thì cả hai dòng đều có nền primary.
      setOpenId(section?.id ?? null)
    })
  }, [pathname])

  const toggleSection = (id) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Sidebar - giữ nguyên như hiện tại */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-50">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <img
              src={BRAND_LOGO_SRC}
              alt={BRAND_NAME}
              className="h-10 w-auto max-w-[160px] object-contain"
            />
            <div className="min-w-0">
              <h1 className="text-primary text-lg font-bold leading-none truncate">{BRAND_NAME}</h1>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-1">B2B Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {B2B_SIDEBAR_NAV.map((section) => {
            const isLink = section.href && (!section.children || section.children.length === 0)
            const linkActive = isLink && isSectionLinkActive(pathname, section)
            if (isLink) {
              return (
                <Link
                  key={section.id}
                  to={section.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    linkActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon name={section.icon} className="text-xl" />
                  <span className="text-sm font-semibold">{section.label}</span>
                </Link>
              )
            }
            const isOpen = openId === section.id
            const hasActiveChild = section.children?.some((c) => isChildActive(pathname, c.href))
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    hasActiveChild
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon name={section.icon} className="text-xl" />
                    <span className="text-sm font-semibold">{section.label}</span>
                  </div>
                  <Icon
                    name="expand_more"
                    className={`text-xs text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {section.children?.length > 0 && (
                  <div
                    className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="ml-9 flex flex-col gap-1 py-1 mb-2">
                      {section.children.map((child) => {
                        const active = isChildActive(pathname, child.href)
                        return (
                          <Link
                            key={child.label}
                            to={child.href}
                            className={`text-xs py-1.5 pl-3 transition-colors border-l-2 ${
                              active
                                ? 'text-primary font-medium border-primary'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary/30'
                            }`}
                          >
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon name="logout" className="text-lg" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 min-h-screen flex flex-col">
        <div className="sticky top-0 z-40 flex items-center justify-end gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-6 py-2">
          <NotificationBell variant="partner" />
        </div>
        <Outlet />
      </main>
      <CustomerAssistantFab namespace="b2b" />
    </div>
  )
}
