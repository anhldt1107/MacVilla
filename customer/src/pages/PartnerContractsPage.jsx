import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { storeB2bFetchContracts } from '../api/store/storeB2bContractsApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { contractStatusLabel, contractStatusBadgeClass } from '../lib/contractStatus'
import { useAuth } from '../contexts/AuthContext'

/** Preset lọc — giá trị gửi thẳng query `status` (PascalCase theo domain). */
const CONTRACT_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PendingConfirmation', label: 'Chờ khách xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Active', label: 'Đang hiệu lực' },
  { value: 'Draft', label: 'Nháp' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'Expired', label: 'Hết hiệu lực' },
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

export function PartnerContractsPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [filterStatus, setFilterStatus] = useState('')
  const [headerSearch, setHeaderSearch] = useState('')

  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const apiStatus = filterStatus.trim() || undefined

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
      const data = await storeB2bFetchContracts(accessToken, {
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
    return items.filter(
      (r) =>
        (r.contractNumber && String(r.contractNumber).toLowerCase().includes(q)) ||
        (r.quoteCode && String(r.quoteCode).toLowerCase().includes(q)) ||
        String(r.id).includes(q)
    )
  }, [items, headerSearch])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  return (
    <>
      <PartnerPaymentsPageHeader title="Hợp đồng" />

      <section className="px-8 pb-12 max-w-6xl">
        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem hợp đồng.
          </div>
        ) : null}

        {loadError ? (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap items-center justify-between gap-2"
            role="alert"
          >
            {loadError}
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm font-bold text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
            />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Tìm mã HĐ / mã báo giá…"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[200px]"
          >
            {CONTRACT_STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Mã HĐ
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Mã báo giá
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    Hiệu lực
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                    Giá trị
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">
                    Đơn
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-24">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                      Không có hợp đồng phù hợp.
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? displayed.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3 text-sm font-bold text-primary whitespace-nowrap">
                          {row.contractNumber}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {row.quoteCode ? (
                            <Link
                              to={`/partner/quotation/${encodeURIComponent(row.quoteCode)}`}
                              className="text-primary font-medium hover:underline"
                            >
                              {row.quoteCode}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${contractStatusBadgeClass(row.status)}`}
                          >
                            {contractStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(row.validFrom)} → {formatDate(row.validTo)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap">
                          {formatMoneyVnd(row.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-slate-600">
                          {row.orderCount != null ? row.orderCount : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/partner/contracts/${encodeURIComponent(row.contractNumber)}`}
                            className="inline-flex p-2 text-slate-400 hover:text-primary"
                            title="Xem chi tiết"
                          >
                            <Icon name="visibility" className="text-lg" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            <span>
              {totalCount === 0
                ? '0 hợp đồng'
                : `Hiển thị ${rangeFrom}–${rangeTo} / ${totalCount}`}
              {headerSearch.trim() && displayed.length !== items.length ? (
                <span className="text-slate-400"> (lọc cục bộ trên trang)</span>
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
