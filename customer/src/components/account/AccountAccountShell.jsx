import { AccountSidebarNav } from './AccountSidebarNav'
import { ACCOUNT_SIDEBAR_NAV } from '../../data/account'

/**
 * Khung hai cột cho khu account B2C: hero tùy trang → sidebar + children.
 *
 * @param {{
 *   hero: import('react').ReactNode
 *   children: import('react').ReactNode
 * }} props
 */
export function AccountAccountShell({ hero, children }) {
  return (
    <>
      {hero}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
          <nav className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Menu chính
            </h3>
            <div className="space-y-1">
              <AccountSidebarNav items={ACCOUNT_SIDEBAR_NAV} />
            </div>
          </nav>
        </aside>

        <section className="lg:col-span-9">{children}</section>
      </div>
    </>
  )
}
