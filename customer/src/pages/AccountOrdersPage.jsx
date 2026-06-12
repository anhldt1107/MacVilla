import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { PROFILE_AVATAR } from '../data/account'
import { storeMeFetchOrders } from '../api/store/storeMeOrdersApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { normalizeOrdersList, pickPayable } from '../lib/orders/customerOrdersList'
import {
  customerOrderStatusLabel,
  customerPaymentStatusLabel,
  customerOrderStatusBadgeClass,
  customerPaymentStatusBadgeClass,
} from '../lib/customerOrderStatus'
import { PayOsResumeButton } from '../components/checkout/PayOsResumeButton'
import { canResumePayOsPayment } from '../lib/checkout/payOsCheckout'

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(value)) + 'đ'
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

const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái đơn' },
  { value: 'New', label: 'Mới tạo' },
  { value: 'AwaitingPayment', label: 'Chờ thanh toán' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Processing', label: 'Đang xử lý' },
  { value: 'ReadyToShip', label: 'Chuẩn bị giao' },
  { value: 'Shipped', label: 'Đang giao' },
  { value: 'Delivered', label: 'Đã giao' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
]

export function AccountOrdersPage() {
  const { user, accessToken } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [filterOrderStatus, setFilterOrderStatus] = useState('')
  const [headerSearch, setHeaderSearch] = useState('')

  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const apiOrderStatus = filterOrderStatus.trim() || undefined

  useEffect(() => {
    setPage(1)
  }, [filterOrderStatus])

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
      const data = await storeMeFetchOrders(accessToken, {
        page,
        pageSize,
        ...(apiOrderStatus ? { orderStatus: apiOrderStatus } : {}),
      })
      const n = normalizeOrdersList(data)
      setItems(n.items)
      setTotalCount(n.totalCount)
    } catch (err) {
      setLoadError(getApiErrorMessage(err))
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, pageSize, apiOrderStatus])

  useEffect(() => {
    void load()
  }, [load])

  const displayed = useMemo(() => {
    const q = headerSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => {
      const row = /** @type {Record<string, unknown>} */ (r)
      const code = row.orderCode != null ? String(row.orderCode).toLowerCase() : ''
      return code.includes(q) || String(row.id ?? '').includes(q)
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
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đơn của tôi</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <>
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đơn của tôi</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Theo dõi trạng thái đơn hàng và thanh toán.
            </p>
          </div>

          {!accessToken ? (
            <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
              <Link to="/login" className="font-bold underline">
                Đăng nhập
              </Link>{' '}
              để xem đơn hàng.
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
                placeholder="Tìm theo mã đơn (trên trang hiện tại)…"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              value={filterOrderStatus}
              onChange={(e) => setFilterOrderStatus(e.target.value)}
              className="w-full sm:w-auto min-w-[240px] px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              {ORDER_STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã đơn</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                      Ngày đặt
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Trạng thái đơn</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Thanh toán</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                      Thành tiền
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-32">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Đang tải…
                      </td>
                    </tr>
                  ) : null}
                  {!loading && displayed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Không có đơn hàng.
                      </td>
                    </tr>
                  ) : null}
                  {!loading
                    ? displayed.map((row) => {
                        const r = /** @type {Record<string, unknown>} */ (row)
                        const code =
                          r.orderCode != null ? String(r.orderCode) : String(r.id ?? '')
                        return (
                          <tr
                            key={r.id != null ? String(r.id) : code}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                          >
                            <td className="px-4 py-3 text-sm font-bold text-primary whitespace-nowrap">
                              {code}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formatDateTime(
                                typeof r.createdAt === 'string' ? r.createdAt : undefined
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${customerOrderStatusBadgeClass(
                                  typeof r.orderStatus === 'string' ? r.orderStatus : ''
                                )}`}
                              >
                                {customerOrderStatusLabel(
                                  typeof r.orderStatus === 'string' ? r.orderStatus : ''
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${customerPaymentStatusBadgeClass(
                                  typeof r.paymentStatus === 'string' ? r.paymentStatus : ''
                                )}`}
                              >
                                {customerPaymentStatusLabel(
                                  typeof r.paymentStatus === 'string' ? r.paymentStatus : ''
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap">
                              {formatPrice(pickPayable(r))}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                {canResumePayOsPayment(r) ? (
                                  <PayOsResumeButton
                                    accessToken={accessToken}
                                    orderCode={code}
                                    paymentMethod={
                                      typeof r.paymentMethod === 'string'
                                        ? r.paymentMethod
                                        : 'PayOS'
                                    }
                                    label=""
                                    busyLabel=""
                                    className="inline-flex p-2 text-amber-600 hover:text-primary disabled:opacity-50"
                                  />
                                ) : null}
                                <Link
                                  to={`/account/orders/${encodeURIComponent(code)}`}
                                  className="inline-flex p-2 text-slate-400 hover:text-primary"
                                  title="Chi tiết"
                                >
                                  <Icon name="visibility" className="text-lg" />
                                </Link>
                              </div>
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
                  ? '0 đơn'
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
