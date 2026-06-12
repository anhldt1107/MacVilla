import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { storeB2bFetchWarrantyTickets } from '../api/store/storeB2bWarrantyApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  warrantyTicketStatusLabel,
  warrantyTicketStatusBadgeClass,
} from '../lib/customerWarrantyLabels'
import { useAuth } from '../contexts/AuthContext'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Active', label: 'Đang hiệu lực' },
  { value: 'Expired', label: 'Hết hạn' },
  { value: 'Voided', label: 'Đã vô hiệu hóa' },
]

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
function normalizeListPayload(raw) {
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

/** @param {Record<string, unknown>} r */
function rowTicket(r) {
  return r.ticketNumber != null ? String(r.ticketNumber) : String(r.id ?? '')
}

/** @param {Record<string, unknown>} r */
function rowClaimCounts(r) {
  const total =
    typeof r.claimCount === 'number'
      ? r.claimCount
      : Array.isArray(r.claims)
        ? r.claims.length
        : null
  const pending = typeof r.pendingClaimCount === 'number' ? r.pendingClaimCount : null
  if (total == null && pending == null) return '—'
  if (pending != null && total != null) return `${total} / chờ ${pending}`
  if (total != null) return String(total)
  return `— / chờ ${pending}`
}

export function PartnerWarrantyListPage() {
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
      const data = await storeB2bFetchWarrantyTickets(accessToken, {
        page,
        pageSize,
        ...(apiStatus ? { status: apiStatus } : {}),
      })
      const n = normalizeListPayload(data)
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
    return items.filter((row) => {
      const r = /** @type {Record<string, unknown>} */ (row)
      const ticket = rowTicket(r).toLowerCase()
      const oc = r.orderCode != null ? String(r.orderCode).toLowerCase() : ''
      const cn = r.contractNumber != null ? String(r.contractNumber).toLowerCase() : ''
      return ticket.includes(q) || oc.includes(q) || cn.includes(q)
    })
  }, [items, headerSearch])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  return (
    <>
      <PartnerPaymentsPageHeader
        title="Bảo hành"
        below={
          <div className="mb-2">
            <Link
              to="/partner/after-sales/warranty/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-95"
            >
              <Icon name="add" className="text-lg" />
              Tạo yêu cầu từ đơn hàng
            </Link>
          </div>
        }
      />

      <section className="p-8 pt-2 max-w-6xl">
        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem phiếu bảo hành.
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
              placeholder="Tìm mã phiếu, mã đơn, hợp đồng… (trên trang hiện tại)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[200px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1020px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã phiếu</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    Ngày phát hành
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    Hết hạn
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    Claim / chờ xử lý
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã đơn</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Hợp đồng</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-24">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
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
                      Chưa có phiếu bảo hành.
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? displayed.map((row) => {
                      const r = /** @type {Record<string, unknown>} */ (row)
                      const ticket = rowTicket(r)
                      const st = typeof r.status === 'string' ? r.status : ''
                      return (
                        <tr
                          key={r.id != null ? String(r.id) : ticket}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-bold text-primary font-mono text-sm">{ticket}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(typeof r.issueDate === 'string' ? r.issueDate : undefined)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(typeof r.validUntil === 'string' ? r.validUntil : undefined)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${warrantyTicketStatusBadgeClass(st)}`}
                            >
                              {warrantyTicketStatusLabel(st)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {rowClaimCounts(r)}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">
                            {r.orderCode != null ? String(r.orderCode) : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">
                            {r.contractNumber != null ? String(r.contractNumber) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/partner/after-sales/warranty/${encodeURIComponent(ticket)}`}
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
      </section>
    </>
  )
}
