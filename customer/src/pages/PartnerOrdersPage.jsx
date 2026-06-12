import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { storeB2bFetchOrders } from '../api/store/storeB2bOrdersApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  b2bOrderStatusLabel,
  b2bPaymentStatusLabel,
  b2bOrderStatusBadgeClass,
  b2bPaymentStatusBadgeClass,
} from '../lib/b2bOrderStatus'
import { useAuth } from '../contexts/AuthContext'

const B2B_ORDERS_TOAST_KEY = 'macvilla_b2b_orders_toast'

/** Giá trị gửi thẳng query — PascalCase theo domain (điều chỉnh khi đối chiếu Swagger). */
const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái đơn' },
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'Processing', label: 'Đang xử lý' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Shipped', label: 'Đang giao' },
  { value: 'Delivered', label: 'Đã giao' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả thanh toán' },
  { value: 'Unpaid', label: 'Chưa thanh toán' },
  { value: 'PartiallyPaid', label: 'Thanh toán một phần' },
  { value: 'Paid', label: 'Đã thanh toán' },
  { value: 'Pending', label: 'Chờ thanh toán' },
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

export function PartnerOrdersPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const [b2bToast, setB2bToast] = useState('')

  const [page, setPage] = useState(1)
  const pageSize = 20
  const [filterOrderStatus, setFilterOrderStatus] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [headerSearch, setHeaderSearch] = useState('')

  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    try {
      const t = sessionStorage.getItem(B2B_ORDERS_TOAST_KEY)
      if (t) {
        sessionStorage.removeItem(B2B_ORDERS_TOAST_KEY)
        setB2bToast(t)
      }
    } catch {
      /* private mode */
    }
  }, [])

  const apiOrderStatus = filterOrderStatus.trim() || undefined
  const apiPaymentStatus = filterPaymentStatus.trim() || undefined

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
      const data = await storeB2bFetchOrders(accessToken, {
        page,
        pageSize,
        ...(apiOrderStatus ? { orderStatus: apiOrderStatus } : {}),
        ...(apiPaymentStatus ? { paymentStatus: apiPaymentStatus } : {}),
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
  }, [accessToken, page, pageSize, apiOrderStatus, apiPaymentStatus])

  useEffect(() => {
    void load()
  }, [load])

  const displayed = useMemo(() => {
    const q = headerSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => {
      const code = r.orderCode != null ? String(r.orderCode).toLowerCase() : ''
      return code.includes(q) || String(r.id ?? '').includes(q)
    })
  }, [items, headerSearch])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  const pickPayable = (row) => {
    if (row.payableTotal != null) return row.payableTotal
    if (row.totalAmount != null) return row.totalAmount
    return null
  }

  return (
    <>
      {b2bToast ? (
        <div className="px-8 pt-8 max-w-6xl mx-auto w-full">
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-2"
            role="status"
          >
            {b2bToast}
            <button
              type="button"
              className="text-sm font-bold text-primary hover:underline shrink-0"
              onClick={() => setB2bToast('')}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}

      <PartnerPaymentsPageHeader title="Quản lý đơn hàng" />

      <section className="px-8 pb-12 max-w-6xl">
        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem đơn hàng.
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

        <div className="flex flex-col lg:flex-row gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
            />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Tìm mã đơn (trên trang hiện tại)…"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <select
            value={filterOrderStatus}
            onChange={(e) => {
              setFilterOrderStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[200px]"
          >
            {ORDER_STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'os-all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filterPaymentStatus}
            onChange={(e) => {
              setFilterPaymentStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[200px]"
          >
            {PAYMENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'ps-all'} value={o.value}>
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
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Đơn hàng
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Thanh toán
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-24">
                    Chi tiết
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
                      Không có đơn hàng phù hợp.
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? displayed.map((row) => {
                      const code =
                        row.orderCode != null
                          ? String(row.orderCode)
                          : String(row.id ?? '')
                      return (
                        <tr
                          key={row.id ?? code}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-4 py-3 text-sm font-bold text-primary whitespace-nowrap">
                            {code}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDateTime(row.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b2bOrderStatusBadgeClass(row.orderStatus)}`}
                            >
                              {b2bOrderStatusLabel(row.orderStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b2bPaymentStatusBadgeClass(row.paymentStatus)}`}
                            >
                              {b2bPaymentStatusLabel(row.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap">
                            {formatMoneyVnd(pickPayable(row))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/partner/orders/${encodeURIComponent(code)}`}
                              className="inline-flex p-2 text-slate-400 hover:text-primary"
                              title="Xem chi tiết"
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
      </section>
    </>
  )
}
