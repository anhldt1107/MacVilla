import { useAuth } from '../../contexts/AuthContext'

function initialsFrom(text) {
  if (!text?.trim()) return 'B2'
  const parts = text.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0] || ''
    const b = parts[parts.length - 1][0] || ''
    const out = (a + b).toUpperCase()
    return out || 'B2'
  }
  return text.trim().slice(0, 2).toUpperCase() || 'B2'
}

/**
 * Họ tên + doanh nghiệp (MST) từ session B2B.
 */
export function PartnerHeaderUser({
  className = '',
  size = 'md',
  hideTextOnMobile = true,
}) {
  const { user } = useAuth()
  const primary = user?.fullName || user?.name || 'Khách B2B'
  const company = (user?.companyName || '').trim()
  const tax = (user?.taxCode || '').trim()

  let secondary = ''
  if (company && tax) secondary = `${company} · MST ${tax}`
  else if (company) secondary = company
  else if (tax) secondary = `MST ${tax}`
  else if (user?.customerType === 'B2B') secondary = 'Tài khoản doanh nghiệp'

  const initials = initialsFrom(company || primary)
  const avatar =
    size === 'sm'
      ? 'w-9 h-9 text-xs'
      : size === 'lg'
        ? 'w-11 h-11 text-sm'
        : 'w-10 h-10 text-sm'
  const primaryCls =
    size === 'sm'
      ? 'text-xs font-bold text-slate-900 dark:text-white truncate'
      : 'text-sm font-bold text-slate-900 dark:text-white truncate'

  const textWrap = hideTextOnMobile
    ? 'text-right hidden sm:block min-w-0 max-w-[220px]'
    : 'text-right min-w-0 max-w-[240px]'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={textWrap}>
        <p className={primaryCls} title={primary}>
          {primary}
        </p>
        {secondary ? (
          <p
            className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate"
            title={secondary}
          >
            {secondary}
          </p>
        ) : null}
      </div>
      <div
        className={`${avatar} rounded-full border border-slate-200 dark:border-slate-700 bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold`}
        aria-hidden
      >
        {initials}
      </div>
    </div>
  )
}
