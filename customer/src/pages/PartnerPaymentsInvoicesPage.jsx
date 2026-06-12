import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { storeB2bFetchInvoices } from '../api/store/storeB2bDebtInvoicesApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  invoiceStatusLabel,
  invoiceStatusBadgeClass,
  invoiceDaysUntilDueClass,
} from '../lib/invoiceStatus'
import { useAuth } from '../contexts/AuthContext'

const STATUS_FILTER = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Unpaid', label: 'Chưa thanh toán' },
  { value: 'PartiallyPaid', label: 'Thanh toán một phần' },
  { value: 'Paid', label: 'Đã thanh toán' },
  { value: 'Overdue', label: 'Quá hạn' },
  { value: 'Draft', label: 'Nháp' },
  { value: 'Issued', label: 'Đã phát hành' },
  { value: 'Cancelled', label: 'Đã hủy' },
]

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDaysLabel(days) {
  if (days == null || Number.isNaN(Number(days))) return '—'
  const n = Math.floor(Number(days))
  if (n < 0) return `${n} ngày (quá hạn)`
  if (n === 0) return 'Đến hạn hôm nay'
  return `Còn ${n} ngày`
}

export function PartnerPaymentsInvoicesPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterStatus = searchParams.get('status') || ''

  const [page, setPage] = useState(1)
  const pageSize = 20
  const [headerSearch, setHeaderSearch] = useState('')

  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const apiStatus = filterStatus.trim() || undefined

  useEffect(() => {
    setPage(1)
  }, [filterStatus])

  const load = useCallback(async () => {
    if (!accessToken) {
      setItems([])
      setTotalCount(0)
      setLoading(false)
      setLoadError('')
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const data = await storeB2bFetchInvoices(accessToken, {
        page,
        pageSize,
        ...(apiStatus ? { status: apiStatus } : {}),
      })
      setItems(data.items ?? [])
      setTotalCount(data.totalCount ?? 0)
    } catch (err) {
      setLoadError(getApiErrorMessage(err))
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, pageSize, apiStatus])

  useEffect(() => {
    void load()
  }, [load])

  const displayed = useMemo(() => {
    const q = headerSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => {
      const no = r.invoiceNumber != null ? String(r.invoiceNumber).toLowerCase() : ''
      const oc = r.orderCode != null ? String(r.orderCode).toLowerCase() : ''
      return no.includes(q) || oc.includes(q)
    })
  }, [items, headerSearch])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  const onFilterChange = (value) => {
    setPage(1)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('status', value)
    else next.delete('status')
    setSearchParams(next, { replace: true })
  }

  return (
    <>
      <PartnerPaymentsPageHeader title="Hóa đơn VAT" paymentsNav />

      <section className="p-8 pt-6 max-w-6xl">
        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem hóa đơn.
          </div>
        ) : null}

        {loadError ? (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap justify-between gap-2"
            role="alert"
          >
            {loadError}
            <button
              type="button"
              onClick={() => void load()}
              className="font-bold text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
            />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Tìm số HĐ, mã đơn… (trên trang hiện tại)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[220px]"
          >
            {STATUS_FILTER.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Số HĐ</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    Ngày HĐ
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    Hạn TT
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Còn lại</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Hạn nộp</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-28">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                      Đang tải…
                    </td>
                  </tr>
                ) : null}
                {!loading && displayed.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                      Không có hóa đơn phù hợp.
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? displayed.map((row) => {
                      const inv =
                        row.invoiceNumber != null ? String(row.invoiceNumber) : String(row.id ?? '')
                      const days = row.daysUntilDue
                      return (
                        <tr
                          key={row.id ?? inv}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-bold text-primary font-mono text-sm">{inv}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(row.issueDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(row.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-right">
                            {formatMoneyVnd(row.remainingAmount)}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm ${invoiceDaysUntilDueClass(
                              typeof days === 'number' ? days : Number(days)
                            )}`}
                          >
                            {formatDaysLabel(typeof days === 'number' ? days : Number(days))}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${invoiceStatusBadgeClass(row.status)}`}
                            >
                              {invoiceStatusLabel(row.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/partner/payments/invoices/${encodeURIComponent(inv)}`}
                              className="inline-flex p-2 text-slate-400 hover:text-primary"
                              title="Chi tiết"
                            >
                              <Icon name="visibility" className="text-lg" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            <span>
              {totalCount === 0
                ? '0 hóa đơn'
                : `Hiển thị ${rangeFrom}–${rangeTo} / ${totalCount}`}
              {headerSearch.trim() && displayed.length !== items.length ? (
                <span className="text-slate-400"> (lọc cục bộ)</span>
              ) : null}
            </span>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                disabled={page >= totalPages || loading || totalCount === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Tiếp
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
