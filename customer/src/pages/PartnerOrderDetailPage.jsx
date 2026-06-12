import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import {
  storeB2bFetchOrderByCode,
  storeB2bFetchOrderTimeline,
} from '../api/store/storeB2bOrdersApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  b2bOrderStatusLabel,
  b2bPaymentStatusLabel,
  b2bOrderStatusBadgeClass,
  b2bPaymentStatusBadgeClass,
} from '../lib/b2bOrderStatus'
import { useAuth } from '../contexts/AuthContext'

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

/** @param {unknown} sales */
function formatSales(sales) {
  if (sales == null) return '—'
  if (typeof sales === 'string') return sales
  if (typeof sales === 'object' && sales !== null) {
    const o = /** @type {Record<string, unknown>} */ (sales)
    if (o.fullName) return String(o.fullName)
    if (o.name) return String(o.name)
  }
  return '—'
}

/** @param {unknown} f */
function formatFulfillmentLine(f) {
  if (f == null) return '—'
  if (typeof f === 'object' && f !== null) {
    const o = /** @type {Record<string, unknown>} */ (f)
    if (o.fulfillmentCode != null) return String(o.fulfillmentCode)
    if (o.code != null) return String(o.code)
    if (o.status != null) return `Trạng thái: ${String(o.status)}`
    if (o.id != null) return `ID #${String(o.id)}`
  }
  return String(f)
}

/** @param {unknown} addr */
function formatShippingAddress(addr) {
  if (addr == null) return '—'
  if (typeof addr === 'string') return addr
  if (typeof addr === 'object' && addr !== null) {
    const o = /** @type {Record<string, unknown>} */ (addr)
    const parts = [
      o.receiverName,
      o.receiverPhone,
      o.addressLine,
      o.line1,
      o.fullAddress,
    ].filter(Boolean)
    if (parts.length) return parts.map(String).join(' · ')
  }
  return '—'
}

export function PartnerOrderDetailPage() {
  const { orderCode: orderCodeParam } = useParams()
  const orderCode = orderCodeParam ? decodeURIComponent(orderCodeParam) : ''
  const { accessToken, isAuthenticated } = useAuth()

  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [errorDetail, setErrorDetail] = useState('')

  const [activeTab, setActiveTab] = useState(/** @type {'info' | 'timeline'} */ ('info'))
  const [timeline, setTimeline] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [errorTimeline, setErrorTimeline] = useState('')
  const [timelineLoaded, setTimelineLoaded] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!orderCode?.trim()) {
      setErrorDetail('Thiếu mã đơn trên URL.')
      setDetail(null)
      setLoadingDetail(false)
      return
    }
    if (!accessToken) {
      setErrorDetail('Vui lòng đăng nhập tài khoản doanh nghiệp.')
      setDetail(null)
      setLoadingDetail(false)
      return
    }
    setLoadingDetail(true)
    setErrorDetail('')
    try {
      const d = await storeB2bFetchOrderByCode(accessToken, orderCode)
      setDetail(d && typeof d === 'object' ? d : null)
    } catch (err) {
      setErrorDetail(getApiErrorMessage(err))
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [accessToken, orderCode])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  useEffect(() => {
    setTimeline(null)
    setTimelineLoaded(false)
    setErrorTimeline('')
    setActiveTab('info')
  }, [orderCode])

  const loadTimeline = useCallback(async () => {
    if (!accessToken || !orderCode?.trim()) return
    setLoadingTimeline(true)
    setErrorTimeline('')
    try {
      const t = await storeB2bFetchOrderTimeline(accessToken, orderCode)
      setTimeline(t && typeof t === 'object' ? t : null)
    } catch (err) {
      setErrorTimeline(getApiErrorMessage(err))
      setTimeline(null)
    } finally {
      setLoadingTimeline(false)
      setTimelineLoaded(true)
    }
  }, [accessToken, orderCode])

  useEffect(() => {
    if (activeTab !== 'timeline' || timelineLoaded || !accessToken) return
    void loadTimeline()
  }, [activeTab, timelineLoaded, accessToken, loadTimeline])

  const sortedEvents = useMemo(() => {
    const raw = timeline?.events
    if (!Array.isArray(raw)) return []
    return [...raw].sort((a, b) => {
      const ta = new Date(/** @type {any} */ (a).timestamp).getTime()
      const tb = new Date(/** @type {any} */ (b).timestamp).getTime()
      if (Number.isNaN(ta) || Number.isNaN(tb)) return 0
      return ta - tb
    })
  }, [timeline])

  const lines = Array.isArray(detail?.lines) ? detail.lines : []
  const fulfillments = Array.isArray(detail?.fulfillments) ? detail.fulfillments : []

  const quoteCode =
    detail?.quoteCode != null
      ? String(detail.quoteCode)
      : detail?.quote != null &&
          typeof detail.quote === 'object' &&
          /** @type {any} */ (detail.quote).quoteCode != null
        ? String(/** @type {any} */ (detail.quote).quoteCode)
        : ''

  const contractNumber =
    detail?.contractNumber != null ? String(detail.contractNumber) : ''

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
        <Link to="/partner/orders" className="hover:text-primary">
          Đơn hàng
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-slate-900 dark:text-white font-medium truncate">
          {orderCode || '—'}
        </span>
      </nav>

      {!isAuthenticated || !accessToken ? (
        <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
          <Link to="/login" className="font-bold underline">
            Đăng nhập
          </Link>{' '}
          để xem chi tiết.
        </p>
      ) : null}

      {loadingDetail ? (
        <p className="text-slate-500 py-12 text-center">Đang tải đơn hàng…</p>
      ) : null}

      {errorDetail ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 mb-6 flex flex-wrap justify-between gap-2"
          role="alert"
        >
          {errorDetail}
          {accessToken ? (
            <button
              type="button"
              onClick={() => void loadDetail()}
              className="font-bold text-primary hover:underline"
            >
              Thử lại
            </button>
          ) : null}
        </div>
      ) : null}

      {!loadingDetail && detail ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {String(detail.orderCode ?? orderCode)}
              </h1>
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
                <Link
                  to={`/partner/after-sales/returns/create?orderCode=${encodeURIComponent(String(detail.orderCode ?? orderCode))}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  <Icon name="swap_horiz" className="text-lg" />
                  Đổi / trả hàng
                </Link>
                <Link
                  to={`/partner/after-sales/warranty/create?orderCode=${encodeURIComponent(String(detail.orderCode ?? orderCode))}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  <Icon name="build" className="text-lg" />
                  Yêu cầu bảo hành
                </Link>
              </div>
              <p className="text-xs text-slate-500 mb-3 max-w-xl">
                Lỗi sau giao: <strong>đổi trả</strong>. Cần sửa chữa: <strong>bảo hành</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${b2bOrderStatusBadgeClass(
                    typeof detail.orderStatus === 'string' ? detail.orderStatus : ''
                  )}`}
                >
                  {b2bOrderStatusLabel(
                    typeof detail.orderStatus === 'string' ? detail.orderStatus : ''
                  )}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${b2bPaymentStatusBadgeClass(
                    typeof detail.paymentStatus === 'string' ? detail.paymentStatus : ''
                  )}`}
                >
                  {b2bPaymentStatusLabel(
                    typeof detail.paymentStatus === 'string' ? detail.paymentStatus : ''
                  )}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Tạo {formatDateTime(detail.createdAt)}
                {detail.paymentMethod != null ? (
                  <>
                    {' '}
                    · Thanh toán: <span className="font-medium">{String(detail.paymentMethod)}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`pb-3 px-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
                activeTab === 'info'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Thông tin đơn
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 px-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
                activeTab === 'timeline'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Tiến độ
            </button>
          </div>

          {activeTab === 'info' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                {quoteCode ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm">
                    <span className="text-slate-500 text-xs font-bold uppercase block mb-1">
                      Báo giá
                    </span>
                    <Link
                      to={`/partner/quotation/${encodeURIComponent(quoteCode)}`}
                      className="text-primary font-bold hover:underline"
                    >
                      {quoteCode}
                    </Link>
                  </div>
                ) : null}
                {contractNumber ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm">
                    <span className="text-slate-500 text-xs font-bold uppercase block mb-1">
                      Hợp đồng
                    </span>
                    <Link
                      to={`/partner/contracts/${encodeURIComponent(contractNumber)}`}
                      className="text-primary font-bold hover:underline"
                    >
                      {contractNumber}
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-primary/5 dark:bg-primary/10 p-6 grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tiền hàng</p>
                  <p className="font-bold text-lg">{formatMoneyVnd(detail.merchandiseTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Giảm giá</p>
                  <p className="font-bold text-lg">{formatMoneyVnd(detail.discountTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Phải thanh toán</p>
                  <p className="font-bold text-xl text-primary">{formatMoneyVnd(detail.payableTotal)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Icon name="person" className="text-primary" />
                  Sales phụ trách
                </h3>
                <p className="text-slate-700 dark:text-slate-300">{formatSales(detail.sales)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Icon name="location_on" className="text-primary" />
                  Giao hàng
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                  {formatShippingAddress(detail.shippingAddress)}
                </p>
              </div>

              {lines.length > 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-900 dark:text-white">Dòng hàng</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left">SKU / mặt hàng</th>
                          <th className="px-4 py-2 text-right">SL</th>
                          <th className="px-4 py-2 text-right">Đơn giá</th>
                          <th className="px-4 py-2 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lines.map((line, idx) => (
                          <tr key={/** @type {any} */ (line).id ?? idx}>
                            <td className="px-4 py-2">
                              <span className="font-mono text-xs text-slate-500">
                                {/** @type {any} */ (line).sku ?? '—'}
                              </span>
                              <br />
                              <span className="text-slate-800 dark:text-slate-200">
                                {/** @type {any} */ (line).productName ??
                                  /** @type {any} */ (line).name ??
                                  ''}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {/** @type {any} */ (line).quantity ?? '—'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {formatMoneyVnd(/** @type {any} */ (line).unitPrice)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-primary">
                              {formatMoneyVnd(/** @type {any} */ (line).subTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {fulfillments.length > 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Xuất kho</h3>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {fulfillments.map((f, i) => (
                      <li key={i}>{formatFulfillmentLine(f)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {errorTimeline ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex justify-between gap-2"
                  role="alert"
                >
                  {errorTimeline}
                  <button
                    type="button"
                    className="font-bold text-primary shrink-0"
                    onClick={() => void loadTimeline()}
                  >
                    Thử lại
                  </button>
                </div>
              ) : null}

              {loadingTimeline ? (
                <div className="space-y-3 animate-pulse" aria-hidden="true">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
              ) : null}

              {!loadingTimeline && !errorTimeline && timeline ? (
                <>
                  <p className="text-sm text-slate-500">
                    Trạng thái hiện tại:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {typeof timeline.currentStatus === 'string'
                        ? timeline.currentStatus
                        : '—'}
                    </strong>
                  </p>
                  <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                    {sortedEvents.length === 0 ? (
                      <p className="text-sm text-slate-500">Chưa có sự kiện timeline.</p>
                    ) : null}
                    {sortedEvents.map((ev, idx) => {
                      const e = /** @type {Record<string, unknown>} */ (ev)
                      return (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
                          <p className="text-xs font-mono text-slate-400 mb-1">
                            {formatDateTime(
                              typeof e.timestamp === 'string' ? e.timestamp : ''
                            )}
                          </p>
                          <p className="text-xs font-bold text-primary uppercase tracking-wide">
                            {String(e.eventType ?? '—')} · {String(e.status ?? '—')}
                          </p>
                          <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">
                            {String(e.description ?? '')}
                          </p>
                          {e.notes ? (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              {String(e.notes)}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
