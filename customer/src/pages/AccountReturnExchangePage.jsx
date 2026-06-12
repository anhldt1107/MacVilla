import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { PROFILE_AVATAR } from '../data/account'
import { storeMeFetchReturnExchangeRequests } from '../api/store/storeMeReturnExchangeApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  returnExchangeStatusLabel,
  returnExchangeStatusBadgeClass,
  returnExchangeTypeLabel,
  returnExchangeTypeBadgeClass,
} from '../lib/returnExchangeStatus'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Requested', label: 'Yêu cầu đổi trả' },
  { value: 'PendingApproval', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Processing', label: 'Đang thu hồi' },
  { value: 'ItemsReceived', label: 'Đã nhận hàng' },
  { value: 'Completed', label: 'Hoàn tất' },
  { value: 'Rejected', label: 'Từ chối' },
  { value: 'Cancelled', label: 'Đã hủy' },
]

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

export function AccountReturnExchangePage() {
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
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const data = await storeMeFetchReturnExchangeRequests(accessToken, {
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
    return items.filter((r) => {
      const row = /** @type {Record<string, unknown>} */ (r)
      const tn = row.ticketNumber != null ? String(row.ticketNumber).toLowerCase() : ''
      const oc = row.orderCode != null ? String(row.orderCode).toLowerCase() : ''
      return tn.includes(q) || oc.includes(q)
    })
  }, [items, headerSearch])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  if (!user || user.customerType === 'B2B') return null

  return (
    <AccountAccountShell
      hero={
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 overflow-hidden border-4 border-white dark:border-slate-800">
              <img src={PROFILE_AVATAR} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {user.fullName || user.name}
              </h2>
              <p className="text-sm text-slate-500">Đổi / trả hàng</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Đổi / trả hàng</h1>
          <p className="text-sm text-slate-500">Theo dõi yêu cầu trả hoặc đổi sản phẩm.</p>
        </div>
        <Link
          to="/account/returns/create"
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90"
        >
          Tạo yêu cầu mới
        </Link>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {loadError}
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã phiếu / đơn…"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Đang tải…</p>
        ) : displayed.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Chưa có phiếu đổi/trả.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mã phiếu</th>
                  <th className="px-4 py-3 text-left">Đơn</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Tạo lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayed.map((row, idx) => {
                  const r = /** @type {Record<string, unknown>} */ (row)
                  const tn = r.ticketNumber != null ? String(r.ticketNumber) : ''
                  const oc = r.orderCode != null ? String(r.orderCode) : '—'
                  const typ = typeof r.type === 'string' ? r.type : ''
                  const st = typeof r.status === 'string' ? r.status : ''
                  return (
                    <tr key={tn || `row-${idx}`}>
                      <td className="px-4 py-3">
                        {tn ? (
                          <Link
                            to={`/account/returns/${encodeURIComponent(tn)}`}
                            className="font-mono font-bold text-primary hover:underline"
                          >
                            {tn}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{oc}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${returnExchangeTypeBadgeClass(typ)}`}>
                          {returnExchangeTypeLabel(typ)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${returnExchangeStatusBadgeClass(st)}`}>
                          {returnExchangeStatusLabel(st)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDateTime(typeof r.createdAt === 'string' ? r.createdAt : undefined)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-sm text-slate-500 self-center">
            Trang {page}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      ) : null}
    </AccountAccountShell>
  )
}
