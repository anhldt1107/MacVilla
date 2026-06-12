import { useAuth } from '../../contexts/AuthContext'

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

/** Khối thông tin doanh nghiệp B2B từ phiên đăng nhập. */
export function PartnerCompanySummary({ className = '' }) {
  const { user } = useAuth()
  if (!user || user.customerType !== 'B2B') return null

  const company = (user.companyName || '').trim()
  const tax = (user.taxCode || '').trim()
  const addr = (user.companyAddress || '').trim()
  const debt = user.debtBalance

  if (!company && !tax && !addr && debt == null) return null

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm ${className}`}
    >
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        Thông tin doanh nghiệp
      </h4>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {company ? (
          <>
            <dt className="text-slate-500">Tên công ty</dt>
            <dd className="font-semibold text-slate-900 dark:text-slate-100">
              {company}
            </dd>
          </>
        ) : null}
        {tax ? (
          <>
            <dt className="text-slate-500">Mã số thuế</dt>
            <dd className="font-mono font-medium text-slate-900 dark:text-slate-100">
              {tax}
            </dd>
          </>
        ) : null}
        {addr ? (
          <>
            <dt className="text-slate-500 sm:col-span-1">Địa chỉ</dt>
            <dd className="text-slate-800 dark:text-slate-200 sm:col-span-1">
              {addr}
            </dd>
          </>
        ) : null}
        {debt != null ? (
          <>
            <dt className="text-slate-500">Công nợ hiện tại</dt>
            <dd className="font-semibold text-primary">{formatMoneyVnd(debt)}</dd>
          </>
        ) : null}
      </dl>
    </div>
  )
}
