import { useAuth } from '../contexts/AuthContext'
import { StoreAddressBook } from '../components/account/StoreAddressBook'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { PROFILE_AVATAR } from '../data/account'

export function AccountAddressesPage() {
  const { user } = useAuth()

  if (!user || user.customerType === 'B2B') return null

  const displayName = user.fullName || user.name || 'Khách hàng'

  return (
    <AccountAccountShell
      hero={
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shrink-0">
              <img src={PROFILE_AVATAR} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sổ địa chỉ giao hàng</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Sổ địa chỉ</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý địa chỉ nhận hàng và đặt địa chỉ mặc định.
        </p>
      </div>
      <StoreAddressBook variant="account" />
    </AccountAccountShell>
  )
}
