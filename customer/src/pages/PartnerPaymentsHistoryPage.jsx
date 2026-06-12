import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { storeB2bFetchPaymentById, storeB2bFetchPayments } from '../api/store/storeB2bPaymentsApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../api/httpClient'

const HISTORY_TABS = [
  { id: 'all', label: 'Tất cả', transactionType: null },
  { id: 'payment', label: 'Thu tiền', transactionType: 'Payment' },
  { id: 'refund', label: 'Hoàn tiền', transactionType: 'Refund' },
  { id: 'adj_inc', label: 'Điều chỉnh tăng', transactionType: 'AdjustmentIncrease' },
  { id: 'adj_dec', label: 'Điều chỉnh giảm', transactionType: 'AdjustmentDecrease' },
]

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
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

/** @param {string | null | undefined} type */
function transactionTypeLabel(type) {
  const t = String(type ?? '').trim()
  const map = {
    Payment: 'Thu tiền',
    Refund: 'Hoàn tiền',
    AdjustmentIncrease: 'Điều chỉnh tăng',
    AdjustmentDecrease: 'Điều chỉnh giảm',
  }
  return map[t] || t || '—'
}

/** @param {string | null | undefined} type */
function transactionToneClass(type) {
  const t = String(type ?? '')
  if (t === 'Refund' || t === 'AdjustmentDecrease') {
    return 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
  }
  if (t === 'Payment' || t === 'AdjustmentIncrease') {
    return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
}

export function PartnerPaymentsHistoryPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [items, setItems] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detailId, setDetailId] = useState(/** @type {number | null} */ (null))
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [detailLoading, setDetailLoading] = useState(false)

  const tabType = HISTORY_TABS.find((t) => t.id === activeTab)?.transactionType ?? null

  const load = useCallback(async () => {
    if (!accessToken) {
      setItems([])
      setTotalCount(0)
      setLoading(false)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await storeB2bFetchPayments(accessToken, {
        page,
        pageSize,
        transactionType: tabType || undefined,
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
      })
      const rawItems = Array.isArray(data?.items) ? data.items : []
      setTotalCount(Number(data?.totalCount) || rawItems.length)
      setItems(rawItems)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, tabType, fromDate, toDate])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [activeTab, fromDate, toDate])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => {
      const id = r.id != null ? String(r.id) : ''
      const ref = r.referenceCode != null ? String(r.referenceCode).toLowerCase() : ''
      const note = r.note != null ? String(r.note).toLowerCase() : ''
      const inv = r.invoiceNumber != null ? String(r.invoiceNumber).toLowerCase() : ''
      return id.includes(q) || ref.includes(q) || note.includes(q) || inv.includes(q)
    })
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const openDetail = async (id) => {
    const num = Number(id)
    if (!accessToken || !Number.isFinite(num)) return
    setDetailId(num)
    setDetail(null)
    setDetailLoading(true)
    try {
      const d = await storeB2bFetchPaymentById(accessToken, num)
      setDetail(d && typeof d === 'object' ? /** @type {Record<string, unknown>} */ (d) : null)
    } catch (err) {
      setDetail(null)
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Không tải được chi tiết.'
      setDetail({ __error: msg })
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailId(null)
    setDetail(null)
  }

  const inv = detail?.invoice && typeof detail.invoice === 'object' ? detail.invoice : null
  const invNumber = inv && /** @type {Record<string, unknown>} */ (inv).invoiceNumber != null
    ? String(/** @type {Record<string, unknown>} */ (inv).invoiceNumber)
    : ''

  return (
    <>
      <PartnerPaymentsPageHeader
        title="Lịch sử thanh toán"
        paymentsNav
        below={
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto">
            {HISTORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <section className="p-8 pt-4">
        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem lịch sử thanh toán đã ghi nhận.
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 mb-6 flex flex-wrap justify-between gap-2"
            role="alert"
          >
            {error}
            <button type="button" onClick={() => void load()} className="font-bold text-primary hover:underline">
              Thử lại
            </button>
          </div>
        ) : null}

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end mb-6">
          <div className="flex-1 min-w-[220px] relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm trên trang hiện tại (mã GD, CK, HĐ…)…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              Từ
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-sm"
              />
            </label>
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              Đến
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-sm"
              />
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {loading ? (
            <p className="text-center text-slate-500 py-12 text-sm">Đang tải…</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[860px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã GD</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tham chiếu</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PTTT</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Số tiền</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hóa đơn</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredRows.map((row) => {
                      const id = row.id != null ? Number(row.id) : NaN
                      const invNo = row.invoiceNumber != null ? String(row.invoiceNumber) : ''
                      const pm = row.paymentMethod != null ? String(row.paymentMethod) : '—'
                      const tt = row.transactionType != null ? String(row.transactionType) : ''
                      const amount = row.amount
                      const isOut = tt === 'Refund' || tt === 'AdjustmentDecrease'
                      const amountClass = isOut ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                      return (
                        <tr key={String(row.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDateTime(row.paymentDate != null ? String(row.paymentDate) : '')}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono font-medium text-slate-800 dark:text-slate-100">
                            #{Number.isFinite(id) ? id : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-primary font-semibold font-mono">
                            {row.referenceCode != null ? String(row.referenceCode) : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{pm}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${transactionToneClass(tt)}`}
                            >
                              {transactionTypeLabel(tt)}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm font-bold text-right ${amountClass}`}>
                            {formatMoneyVnd(amount)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {invNo ? (
                              <Link
                                to={`/partner/payments/invoices/${encodeURIComponent(invNo)}`}
                                className="font-mono font-semibold text-primary hover:underline"
                              >
                                {invNo}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                            {row.note != null ? String(row.note) : ''}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => void openDetail(id)}
                              className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                              title="Xem chi tiết"
                              disabled={!Number.isFinite(id)}
                            >
                              <Icon name="visibility" className="text-lg" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {!loading && filteredRows.length === 0 ? (
                <p className="text-center text-slate-500 py-12 text-sm">Không có giao dịch.</p>
              ) : null}

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Trang {page} / {totalPages} · {totalCount} giao dịch
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {detailId != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-detail-title"
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
              <h3 id="pay-detail-title" className="font-bold text-lg text-slate-900 dark:text-white">
                Chi tiết giao dịch #{detailId}
              </h3>
              <button
                type="button"
                onClick={closeDetail}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Đóng"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {detailLoading ? (
                <p className="text-slate-500">Đang tải…</p>
              ) : detail?.__error ? (
                <p className="text-red-600 dark:text-red-400">{String(detail.__error)}</p>
              ) : detail ? (
                <>
                  <p>
                    <span className="text-slate-500">Thời gian: </span>
                    <span className="font-medium">{formatDateTime(typeof detail.paymentDate === 'string' ? detail.paymentDate : '')}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Số tiền: </span>
                    <span className="font-bold">{formatMoneyVnd(detail.amount)}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">PTTT: </span>
                    {detail.paymentMethod != null ? String(detail.paymentMethod) : '—'}
                  </p>
                  <p>
                    <span className="text-slate-500">Loại: </span>
                    {transactionTypeLabel(
                      detail.transactionType != null ? String(detail.transactionType) : null
                    )}
                  </p>
                  <p>
                    <span className="text-slate-500">Tham chiếu: </span>
                    <span className="font-mono font-semibold">
                      {detail.referenceCode != null ? String(detail.referenceCode) : '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">Ghi chú: </span>
                    {detail.note != null ? String(detail.note) : '—'}
                  </p>
                  {invNumber ? (
                    <p>
                      <span className="text-slate-500">Hóa đơn: </span>
                      <Link
                        to={`/partner/payments/invoices/${encodeURIComponent(invNumber)}`}
                        className="font-mono text-primary font-bold hover:underline"
                        onClick={closeDetail}
                      >
                        {invNumber}
                      </Link>
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-slate-500">Không có dữ liệu.</p>
              )}
              <button
                type="button"
                onClick={closeDetail}
                className="mt-4 w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
