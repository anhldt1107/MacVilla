import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { storeB2bFetchDebtSummary } from '../api/store/storeB2bDebtInvoicesApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { useAuth } from '../contexts/AuthContext'

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

export function PartnerPaymentsDebtPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const [summary, setSummary] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!accessToken) {
      setSummary(null)
      setLoading(false)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const d = await storeB2bFetchDebtSummary(accessToken)
      setSummary(d && typeof d === 'object' ? d : null)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void load()
  }, [load])

  const num = (k) => {
    const v = summary?.[k]
    if (v == null || Number.isNaN(Number(v))) return null
    return Number(v)
  }

  const displayTotalDebt = num('totalUnpaidAmount') ?? num('totalDebtBalance')

  return (
    <>
      <PartnerPaymentsPageHeader title="Công nợ hiện tại" paymentsNav />

      <section className="p-8 pt-6 max-w-6xl">
        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem công nợ.
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap justify-between gap-2"
            role="alert"
          >
            {error}
            <button
              type="button"
              onClick={() => void load()}
              className="font-bold text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-slate-500 text-sm mb-8">Đang tải tổng quan…</p>
        ) : null}

        {!loading && summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon name="account_balance_wallet" className="text-2xl" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng dư nợ hiện tại</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50 mt-1 tracking-tight">
                {formatMoneyVnd(displayTotalDebt)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200/60 dark:border-red-900/40 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  <Icon name="warning" className="text-2xl" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Quá hạn</p>
              <p className="text-xl font-black text-red-700 dark:text-red-300 mt-1 tracking-tight">
                {formatMoneyVnd(num('overdueAmount'))}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {num('overdueCount') != null ? `${num('overdueCount')} hóa đơn` : '—'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200/60 dark:border-amber-900/40 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <Icon name="event_upcoming" className="text-2xl" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sắp đến hạn</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50 mt-1 tracking-tight">
                {formatMoneyVnd(num('dueSoonAmount'))}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {num('dueSoonCount') != null ? `${num('dueSoonCount')} hóa đơn` : '—'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
                  <Icon name="receipt_long" className="text-2xl" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chưa thanh toán (tổng)</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50 mt-1 tracking-tight">
                {formatMoneyVnd(num('totalUnpaidAmount'))}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {num('totalUnpaidCount') != null ? `${num('totalUnpaidCount')} hóa đơn` : '—'}
                {num('paidCount') != null ? ` · Đã tất toán: ${num('paidCount')} HĐ` : ''}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}
