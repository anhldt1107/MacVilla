import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { PROFILE_AVATAR } from '../data/account'
import { storeMeFetchPayments } from '../api/store/storeMePaymentsApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  paymentTransactionTypeLabel,
  paymentTransactionFlowIcon,
  paymentTransactionIsIncoming,
  paymentTransactionTypeBadgeClass,
} from '../lib/customerPaymentTransactionLabels'

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Math.abs(Number(value))) + 'đ'
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** @param {unknown} raw */
function normalizePaged(raw) {
  if (raw == null) return { items: [], totalCount: 0 }
  if (Array.isArray(raw)) return { items: raw, totalCount: raw.length }
  const o = /** @type {Record<string, unknown>} */ (raw)
  const items = Array.isArray(o.items) ? o.items : []
  const totalCount =
    typeof o.totalCount === 'number'
      ? o.totalCount
      : typeof o.total === 'number'
        ? o.total
        : items.length
  return { items, totalCount }
}

function toIsoStartOfDay(dateInput) {
  if (!dateInput?.trim()) return undefined
  const d = new Date(`${dateInput.trim()}T00:00:00`)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function toIsoEndOfDay(dateInput) {
  if (!dateInput?.trim()) return undefined
  const d = new Date(`${dateInput.trim()}T23:59:59.999`)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

const TX_OPTIONS = [
  { value: '', label: 'Tất cả loại giao dịch' },
  { value: 'Payment', label: 'Thanh toán (thu)' },
  { value: 'Refund', label: 'Hoàn tiền' },
  { value: 'AdjustmentIncrease', label: 'Điều chỉnh tăng' },
  { value: 'AdjustmentDecrease', label: 'Điều chỉnh giảm' },
]

export function AccountPaymentsPage() {
  const { user, accessToken } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [filterTx, setFilterTx] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [invoiceIdFilter, setInvoiceIdFilter] = useState('')
  const [headerSearch, setHeaderSearch] = useState('')

  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const apiTx = filterTx.trim() || undefined
  const apiFrom = toIsoStartOfDay(fromDate)
  const apiTo = toIsoEndOfDay(toDate)
  const invNum = invoiceIdFilter.trim() !== '' ? Number(invoiceIdFilter.trim()) : NaN
  const apiInvoiceId = Number.isFinite(invNum) && invNum > 0 ? invNum : undefined

  useEffect(() => {
    setPage(1)
  }, [filterTx, fromDate, toDate, invoiceIdFilter])

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
      const data = await storeMeFetchPayments(accessToken, {
        page,
        pageSize,
        ...(apiTx ? { transactionType: apiTx } : {}),
        ...(apiFrom ? { fromDate: apiFrom } : {}),
        ...(apiTo ? { toDate: apiTo } : {}),
        ...(apiInvoiceId != null ? { invoiceId: apiInvoiceId } : {}),
      })
      const n = normalizePaged(data)
      setItems(n.items)
      setTotalCount(n.totalCount)
    } catch (err) {
      setLoadError(getApiErrorMessage(err))
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, pageSize, apiTx, apiFrom, apiTo, apiInvoiceId])

  useEffect(() => {
    void load()
  }, [load])

  const displayed = useMemo(() => {
    const q = headerSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => {
      const row = /** @type {Record<string, unknown>} */ (r)
      const ref = row.referenceCode != null ? String(row.referenceCode).toLowerCase() : ''
      const note = row.note != null ? String(row.note).toLowerCase() : ''
      const id = row.id != null ? String(row.id) : ''
      return ref.includes(q) || note.includes(q) || id.includes(q)
    })
  }, [items, headerSearch])

  const rangeSums = useMemo(() => {
    let sumThu = 0
    let sumChi = 0
    for (const r of displayed) {
      const row = /** @type {Record<string, unknown>} */ (r)
      const amt = Number(row.amount)
      if (!Number.isFinite(amt)) continue
      const abs = Math.abs(amt)
      if (paymentTransactionIsIncoming(row.transactionType)) sumThu += abs
      else sumChi += abs
    }
    return { sumThu, sumChi }
  }, [displayed])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  if (!user || user.customerType === 'B2B') return null

  return (
    <AccountAccountShell
      hero={
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20" />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                  <img src={PROFILE_AVATAR} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user.fullName || user.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Lịch sử thanh toán</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <>
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Lịch sử thanh toán</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Tra cứu giao dịch thanh toán và đối soát với đơn hàng.
            </p>
          </div>

          {!accessToken ? (
            <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
              <Link to="/login" className="font-bold underline">
                Đăng nhập
              </Link>{' '}
              để xem lịch sử.
            </p>
          ) : null}

          {loadError ? (
            <div
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap justify-between gap-2"
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

          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 mb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Loại giao dịch
                </label>
                <select
                  value={filterTx}
                  onChange={(e) => setFilterTx(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  {TX_OPTIONS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mã hóa đơn (ID)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 42"
                  value={invoiceIdFilter}
                  onChange={(e) => setInvoiceIdFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
            <div className="relative w-full">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm cục bộ: mã GD, tham chiếu, ghi chú…"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {!loading && displayed.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <Icon name="south_west" className="text-lg" />
                Tổng thu (trang hiện tại):{' '}
                <strong>{formatMoney(rangeSums.sumThu)}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <Icon name="north_east" className="text-lg" />
                Tổng chi (trang hiện tại):{' '}
                <strong>{formatMoney(rangeSums.sumChi)}</strong>
              </span>
            </div>
          ) : null}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-10" />
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Loại</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                      Số tiền
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Phương thức</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Tham chiếu</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Hóa đơn</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-24">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Đang tải…
                      </td>
                    </tr>
                  ) : null}
                  {!loading && displayed.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Không có giao dịch.
                      </td>
                    </tr>
                  ) : null}
                  {!loading
                    ? displayed.map((row, idx) => {
                        const r = /** @type {Record<string, unknown>} */ (row)
                        const id = r.id != null ? String(r.id) : ''
                        const incoming = paymentTransactionIsIncoming(
                          typeof r.transactionType === 'string' ? r.transactionType : ''
                        )
                        const amtClass = incoming
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                        const sign = incoming ? '+' : '−'
                        const inv = r.invoiceNumber != null ? String(r.invoiceNumber) : ''
                        return (
                          <tr
                            key={id || `pay-${idx}`}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                          >
                            <td className="px-4 py-3 text-center text-slate-400">
                              <Icon
                                name={paymentTransactionFlowIcon(
                                  typeof r.transactionType === 'string' ? r.transactionType : ''
                                )}
                                className="text-lg"
                              />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDateTime(
                                typeof r.paymentDate === 'string' ? r.paymentDate : undefined
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${paymentTransactionTypeBadgeClass(
                                  typeof r.transactionType === 'string' ? r.transactionType : ''
                                )}`}
                              >
                                {paymentTransactionTypeLabel(
                                  typeof r.transactionType === 'string' ? r.transactionType : ''
                                )}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${amtClass}`}>
                              {sign} {formatMoney(r.amount)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                              {r.paymentMethod != null ? String(r.paymentMethod) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                              {r.referenceCode != null ? String(r.referenceCode) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {inv ? (
                                <Link
                                  to={`/account/invoices/${encodeURIComponent(inv)}`}
                                  className="text-primary font-semibold hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {inv}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {id ? (
                                <Link
                                  to={`/account/payments/${encodeURIComponent(id)}`}
                                  className="inline-flex p-2 text-slate-400 hover:text-primary"
                                  title="Chi tiết"
                                >
                                  <Icon name="visibility" className="text-lg" />
                                </Link>
                              ) : null}
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
                  ? '0 giao dịch'
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
      </>
    </AccountAccountShell>
  )
}
