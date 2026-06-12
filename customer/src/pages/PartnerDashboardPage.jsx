import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerHeaderUser } from '../components/partner/PartnerHeaderUser'
import { PartnerCompanySummary } from '../components/partner/PartnerCompanySummary'
import { useAuth } from '../contexts/AuthContext'
import { usePartnerDashboardData } from '../hooks/usePartnerDashboardData'
import { contractStatusLabel, contractStatusBadgeClass } from '../lib/contractStatus'
import { statusBadgeClass as quoteStatusBadgeClass } from '../lib/quotationStatus'
import { b2bOrderStatusLabel, b2bOrderStatusBadgeClass } from '../lib/b2bOrderStatus'

function formatToday() {
  return new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

function formatDateIso(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const QUICK_LINKS = [
  {
    to: '/partner/quotation/create',
    icon: 'add_notes',
    label: 'Tạo báo giá',
    primary: true,
  },
  {
    to: '/partner/quotation/history',
    icon: 'history',
    label: 'Danh sách báo giá',
    primary: false,
  },
  {
    to: '/partner/contracts',
    icon: 'gavel',
    label: 'Hợp đồng',
    primary: false,
  },
  {
    to: '/partner/orders',
    icon: 'shopping_cart',
    label: 'Đơn hàng',
    primary: false,
  },
]

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  subLabel,
  linkTo,
}) {
  const inner = (
    <>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconClass}`}>
          <Icon name={icon} className="text-2xl" />
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">{value}</p>
        {subLabel ? <p className="text-xs text-slate-500 mt-1">{subLabel}</p> : null}
      </div>
    </>
  )

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:border-primary/40 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary"
      >
        {inner}
      </Link>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
      {inner}
    </div>
  )
}

export function PartnerDashboardPage() {
  const today = formatToday()
  const { user, accessToken } = useAuth()
  const { loading, error, data } = usePartnerDashboardData(accessToken)

  const welcomeName =
    (user?.companyName || '').trim() ||
    (user?.fullName || user?.name || '').trim() ||
    'quý đối tác'

  const ds = data?.debtSummary
  const debtSub =
    ds != null && typeof ds === 'object'
      ? [
          `${Number(ds.totalUnpaidCount ?? 0)} chứng từ`,
          Number(ds.overdueCount ?? 0) > 0 ? `${Number(ds.overdueCount)} quá hạn` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : ''

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
            Tổng quan đối tác
          </h2>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <PartnerHeaderUser size="sm" hideTextOnMobile={false} />
        </div>
      </header>

      <div className="p-4 sm:p-8">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="min-w-0">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Chào, {welcomeName}
            </h3>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200">
              <Icon name="calendar_today" className="text-slate-400" />
              <span>Hôm nay: {today}</span>
            </div>
          </div>
        </div>

        <PartnerCompanySummary className="mb-8" />

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 h-[140px]"
                />
              ))}
            </>
          ) : (
            <>
              <KpiCard
                icon="assignment_late"
                iconClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                label="Báo giá chờ bạn phản hồi"
                value={String(data?.quotesAwaitingCustomer ?? 0)}
                subLabel="Đã duyệt + counter-offer từ Macvilla"
                linkTo="/partner/quotation/history"
              />
              <KpiCard
                icon="gavel"
                iconClass="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                label="Hợp đồng chờ xác nhận"
                value={String(data?.contractsPendingConfirmation ?? 0)}
                linkTo="/partner/contracts"
              />
              <KpiCard
                icon="receipt_long"
                iconClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                label="Đơn đang xử lý"
                value={String(data?.openOrdersCount ?? 0)}
                subLabel={data?.openOrdersIncomplete ? 'Ước lượng (50 đơn mới nhất)' : undefined}
                linkTo="/partner/orders"
              />
              <KpiCard
                icon="account_balance_wallet"
                iconClass="bg-primary/10 text-primary"
                label="Công nợ chứng từ"
                value={
                  ds && typeof ds === 'object'
                    ? formatMoneyVnd(ds.totalUnpaidAmount)
                    : '—'
                }
                subLabel={debtSub || undefined}
                linkTo="/partner/payments/debt"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                  Hoạt động gần đây
                </h4>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <Link to="/partner/quotation/history" className="text-primary hover:underline">
                    Báo giá
                  </Link>
                  <Link to="/partner/contracts" className="text-primary hover:underline">
                    Hợp đồng
                  </Link>
                  <Link to="/partner/orders" className="text-primary hover:underline">
                    Đơn hàng
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Mã
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        Cập nhật
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                          Đang tải…
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                          Không tải được dữ liệu.
                        </td>
                      </tr>
                    ) : !data?.activityRows?.length ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                          Chưa có dữ liệu.
                        </td>
                      </tr>
                    ) : (
                      data.activityRows.map((row) => {
                        let badgeClass =
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        let badgeText = ''
                        if (row.kind === 'quote') {
                          badgeClass = quoteStatusBadgeClass(row.statusRaw)
                          badgeText = row.statusLabel || ''
                        } else if (row.kind === 'contract') {
                          badgeClass = contractStatusBadgeClass(row.statusRaw)
                          badgeText = contractStatusLabel(row.statusRaw)
                        } else if (row.kind === 'order') {
                          badgeClass = b2bOrderStatusBadgeClass(row.statusRaw)
                          badgeText = b2bOrderStatusLabel(row.statusRaw)
                        }
                        const kindLabel =
                          row.kind === 'quote'
                            ? 'Báo giá'
                            : row.kind === 'contract'
                              ? 'Hợp đồng'
                              : 'Đơn hàng'
                        return (
                          <tr key={row.key}>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {kindLabel}
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                to={row.href}
                                className="text-sm font-bold text-primary hover:underline"
                              >
                                {row.code}
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${badgeClass}`}
                              >
                                {badgeText || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-slate-500">
                              {formatDateIso(row.displayDate)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4">
                Thao tác nhanh
              </h4>
              <div className="space-y-3">
                {QUICK_LINKS.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className={`flex w-full items-center justify-between px-4 py-3 rounded-lg transition-colors group ${
                      action.primary
                        ? 'bg-primary/5 hover:bg-primary/10 text-primary border border-transparent'
                        : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name={action.icon} className="text-xl" />
                      <span className="text-sm font-bold">{action.label}</span>
                    </div>
                    <Icon
                      name="chevron_right"
                      className="text-lg group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {data?.suggestedSalesName ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">
                  Sale Macvilla
                </h4>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {data.suggestedSalesName}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
