import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { PROFILE_AVATAR } from '../data/account'
import { storeMeFetchWarrantyTickets } from '../api/store/storeMeWarrantyApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  warrantyTicketStatusLabel,
  warrantyTicketStatusBadgeClass,
  warrantyDaysRemainingFromValidUntil,
  warrantyTicketIsActive,
} from '../lib/customerWarrantyLabels'

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

const TICKET_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả phiếu' },
  { value: 'Active', label: 'Đang hiệu lực' },
  { value: 'Expired', label: 'Hết hạn' },
]

export function AccountWarrantyPage() {
  const { user, accessToken } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [filterStatus, setFilterStatus] = useState('')
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
      const data = await storeMeFetchWarrantyTickets(accessToken, {
        page,
        pageSize,
        ...(apiStatus ? { status: apiStatus } : {}),
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
  }, [accessToken, page, pageSize, apiStatus])

  useEffect(() => {
    void load()
  }, [load])

  const displayed = useMemo(() => {
    const q = headerSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => {
      const row = /** @type {Record<string, unknown>} */ (r)
      const tn = row.ticketNumber != null ? String(row.ticketNumber).toLowerCase() : ''
      const oc = row.orderCode != null ? String(row.orderCode).toLowerCase() : ''
      return tn.includes(q) || oc.includes(q) || String(row.id ?? '').includes(q)
    })
  }, [items, headerSearch])

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
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bảo hành của tôi</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <>
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bảo hành của tôi</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Phiếu bảo hành điện tử — theo dõi yêu cầu và thời hạn.
            </p>
          </div>

          {!accessToken ? (
            <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
              <Link to="/login" className="font-bold underline">
                Đăng nhập
              </Link>{' '}
              để xem phiếu bảo hành.
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

          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 space-y-4">
            <div className="relative w-full">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo mã phiếu / mã đơn (trên trang hiện tại)…"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto min-w-[240px] px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              {TICKET_STATUS_OPTIONS.map((o) => (
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
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã phiếu</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                      Phát hành
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                      Hết hạn
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">
                      Yêu cầu
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Đơn hàng</th>
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
                        Không có phiếu bảo hành.
                      </td>
                    </tr>
                  ) : null}
                  {!loading
                    ? displayed.map((row) => {
                        const r = /** @type {Record<string, unknown>} */ (row)
                        const tn =
                          r.ticketNumber != null ? String(r.ticketNumber) : String(r.id ?? '')
                        const validUntil =
                          typeof r.validUntil === 'string' ? r.validUntil : undefined
                        const daysLeft = warrantyDaysRemainingFromValidUntil(validUntil)
                        const warnExpiring =
                          typeof daysLeft === 'number' &&
                          daysLeft >= 0 &&
                          daysLeft < 30 &&
                          warrantyTicketIsActive(typeof r.status === 'string' ? r.status : '')
                        const pending =
                          typeof r.pendingClaimCount === 'number' ? r.pendingClaimCount : 0
                        const oc = r.orderCode != null ? String(r.orderCode) : ''
                        return (
                          <tr
                            key={r.id != null ? String(r.id) : tn}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                          >
                            <td className="px-4 py-3 text-sm font-bold text-primary whitespace-nowrap">
                              {tn}
                              {warnExpiring ? (
                                <span
                                  className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300"
                                  title="Phiếu sắp hết hạn"
                                >
                                  <Icon name="warning" className="text-sm" /> Sắp hết hạn
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDate(
                                typeof r.issueDate === 'string' ? r.issueDate : undefined
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDate(validUntil)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${warrantyTicketStatusBadgeClass(
                                  typeof r.status === 'string' ? r.status : ''
                                )}`}
                              >
                                {warrantyTicketStatusLabel(
                                  typeof r.status === 'string' ? r.status : ''
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <span className="text-slate-700 dark:text-slate-300">
                                {typeof r.claimCount === 'number' ? r.claimCount : '—'}
                              </span>
                              {pending > 0 ? (
                                <span className="ml-1 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 text-[10px] font-bold px-1.5 py-0.5 align-middle">
                                  +{pending} chờ
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {oc ? (
                                <Link
                                  to={`/account/orders/${encodeURIComponent(oc)}`}
                                  className="text-primary font-semibold hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {oc}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/account/warranty/${encodeURIComponent(tn)}`}
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
                  ? '0 phiếu'
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
