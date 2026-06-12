import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCartCount } from '../contexts/CartCountContext'
import { Icon } from '../components/ui/Icon'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import {
  storeMeFetchOrderByCode,
  storeMeFetchOrderTimeline,
  storeMeCancelOrder,
  storeMeReorder,
} from '../api/store/storeMeOrdersApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  customerOrderStatusLabel,
  customerPaymentStatusLabel,
  customerOrderStatusBadgeClass,
  customerPaymentStatusBadgeClass,
  customerOrderCanCancel,
} from '../lib/customerOrderStatus'
import { warrantyOrderLineOptions } from '../lib/customerWarrantyLabels'
import { WarrantyClaimModal } from '../components/warranty/WarrantyClaimModal'
import { StoreLineImageThumbnail } from '../components/catalog/StoreLineImageThumbnail'
import { PayOsResumeButton } from '../components/checkout/PayOsResumeButton'
import { canResumePayOsPayment } from '../lib/checkout/payOsCheckout'

const REORDER_TOAST_KEY = 'macvilla_customer_reorder_toast'

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

function CancelOrderModal({ open, onClose, onConfirm, busy, error }) {
  const [reason, setReason] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Đóng"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[1] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hủy đơn hàng</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Nhập lý do hủy. Chỉ áp dụng khi đơn còn trong trạng thái cho phép hủy.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm mb-3"
          placeholder="Ví dụ: Đổi ý không mua nữa"
        />
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={busy || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold disabled:opacity-50"
          >
            {busy ? 'Đang gửi…' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OrderDetailPage() {
  const { orderCode: orderCodeParam } = useParams()
  const orderCode = orderCodeParam ? decodeURIComponent(orderCodeParam) : ''
  const navigate = useNavigate()
  const { user, accessToken } = useAuth()
  const { refreshCartCount } = useCartCount()

  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [errorDetail, setErrorDetail] = useState('')

  const [activeTab, setActiveTab] = useState(/** @type {'info' | 'timeline'} */ ('info'))
  const [timeline, setTimeline] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [errorTimeline, setErrorTimeline] = useState('')
  const [timelineLoaded, setTimelineLoaded] = useState(false)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelModalKey, setCancelModalKey] = useState(0)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const [reorderBusy, setReorderBusy] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [payOsError, setPayOsError] = useState('')

  const [warrantyOpen, setWarrantyOpen] = useState(false)
  const [warrantyModalKey, setWarrantyModalKey] = useState(0)

  const loadDetail = useCallback(async () => {
    if (!orderCode?.trim()) {
      setErrorDetail('Thiếu mã đơn trên URL.')
      setDetail(null)
      setLoadingDetail(false)
      return
    }
    if (!accessToken) {
      setDetail(null)
      setLoadingDetail(false)
      setErrorDetail('')
      return
    }
    setLoadingDetail(true)
    setErrorDetail('')
    try {
      const d = await storeMeFetchOrderByCode(accessToken, orderCode)
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
      const t = await storeMeFetchOrderTimeline(accessToken, orderCode)
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

  const os =
    detail && typeof detail.orderStatus === 'string' ? detail.orderStatus : ''
  const canCancel = customerOrderCanCancel(os)
  const canRequestWarranty = os === 'Delivered' || os === 'Completed'
  const canRequestReturn = canRequestWarranty

  const orderIdNumeric =
    detail?.id != null && Number.isFinite(Number(detail.id)) ? Number(detail.id) : null

  const lines = useMemo(
    () => (Array.isArray(detail?.lines) ? detail.lines : []),
    [detail]
  )
  const warrantyLineOptions = useMemo(() => warrantyOrderLineOptions(lines), [lines])
  const canShowWarrantyButton =
    canRequestWarranty && orderIdNumeric != null && warrantyLineOptions.length > 0

  const hasReturnableLines = useMemo(() => {
    return lines.some((line) => {
      const o = line && typeof line === 'object' ? /** @type {Record<string, unknown>} */ (line) : {}
      const rq = o.returnableQuantity ?? o.ReturnableQuantity
      if (rq != null && Number.isFinite(Number(rq))) return Number(rq) > 0
      const q = o.quantity != null ? Number(o.quantity) : 0
      return Number.isFinite(q) && q > 0
    })
  }, [lines])

  const canShowReturnButton = canRequestReturn && hasReturnableLines && orderCode

  const shipping = detail?.shippingAddress
  const shipObj =
    shipping && typeof shipping === 'object'
      ? /** @type {Record<string, unknown>} */ (shipping)
      : null

  const handleCancel = async (cancelReason) => {
    if (!accessToken || !orderCode) return
    setCancelError('')
    setCancelBusy(true)
    try {
      const updated = await storeMeCancelOrder(accessToken, orderCode, { cancelReason })
      setDetail(
        updated && typeof updated === 'object'
          ? /** @type {Record<string, unknown>} */ (updated)
          : detail
      )
      setCancelOpen(false)
      setActionMsg('Đã hủy đơn hàng.')
      setTimelineLoaded(false)
    } catch (err) {
      setCancelError(getApiErrorMessage(err))
    } finally {
      setCancelBusy(false)
    }
  }

  const handleReorder = async () => {
    if (!accessToken || !orderCode) return
    setReorderBusy(true)
    setActionMsg('')
    try {
      const data = await storeMeReorder(accessToken, orderCode)
      const o = data && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data) : null
      const added = Array.isArray(o?.addedItems) ? o.addedItems : []
      const skipped = Array.isArray(o?.skippedItems) ? o.skippedItems : []
      const message = typeof o?.message === 'string' ? o.message : ''
      try {
        sessionStorage.setItem(
          REORDER_TOAST_KEY,
          JSON.stringify({
            orderCode,
            message,
            addedCount: added.length,
            skipped,
          })
        )
      } catch {
        /* ignore */
      }
      await refreshCartCount()
      navigate('/cart')
    } catch (err) {
      setActionMsg(getApiErrorMessage(err))
    } finally {
      setReorderBusy(false)
    }
  }

  if (!user || user.customerType === 'B2B') return null
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tài khoản', href: '/account' },
    { label: 'Đơn của tôi', href: '/account/orders' },
    { label: orderCode ? `Đơn ${orderCode}` : 'Chi tiết', href: null },
  ]

  const ps =
    detail && typeof detail.paymentStatus === 'string' ? detail.paymentStatus : ''
  const canResumePayOs = detail ? canResumePayOsPayment(detail) : false
  const paymentMethod =
    detail && typeof detail.paymentMethod === 'string' ? detail.paymentMethod : 'PayOS'

  return (
    <div className="max-w-[1280px] mx-auto w-full">
      <WarrantyClaimModal
        key={warrantyModalKey}
        open={warrantyOpen}
        onClose={() => setWarrantyOpen(false)}
        accessToken={accessToken}
        mode="order"
        orderId={orderIdNumeric}
        lineOptions={warrantyLineOptions}
        onSuccess={(data) => {
          const o = data && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data) : null
          const tn = o?.ticketNumber != null ? String(o.ticketNumber) : ''
          const msg =
            typeof o?.message === 'string' && o.message.trim() !== ''
              ? o.message
              : 'Đã gửi yêu cầu bảo hành.'
          setActionMsg(msg)
          setWarrantyOpen(false)
          if (tn) {
            navigate(`/account/warranty/${encodeURIComponent(tn)}`)
          }
        }}
      />

      <CancelOrderModal
        key={cancelModalKey}
        open={cancelOpen}
        onClose={() => {
          if (!cancelBusy) {
            setCancelOpen(false)
            setCancelError('')
          }
        }}
        onConfirm={handleCancel}
        busy={cancelBusy}
        error={cancelError}
      />

      <Breadcrumbs items={breadcrumbItems} />

      {!accessToken ? (
        <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
          <Link to="/login" className="font-bold underline">
            Đăng nhập
          </Link>{' '}
          để xem đơn.
        </p>
      ) : null}

      {loadingDetail ? (
        <p className="text-slate-500 py-8 text-center">Đang tải đơn…</p>
      ) : null}

      {errorDetail && !loadingDetail ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 mb-6 flex justify-between gap-2"
          role="alert"
        >
          {errorDetail}
          <button
            type="button"
            onClick={() => void loadDetail()}
            className="font-bold text-primary shrink-0"
          >
            Thử lại
          </button>
        </div>
      ) : null}

      {actionMsg ? (
        <div
          className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {actionMsg}
        </div>
      ) : null}

      {payOsError ? (
        <div
          className="mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          {payOsError}
        </div>
      ) : null}

      {canResumePayOs ? (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/90 dark:bg-amber-950/25 px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <Icon name="payments" className="text-amber-700 dark:text-amber-400 text-2xl shrink-0" />
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Đơn chờ thanh toán PayOS
            </p>
          </div>
          <PayOsResumeButton
            accessToken={accessToken}
            orderCode={String(detail?.orderCode ?? orderCode)}
            paymentMethod={paymentMethod}
            onError={setPayOsError}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-bold px-5 py-2.5 hover:bg-primary/90 disabled:opacity-60 shrink-0"
          />
        </div>
      ) : null}

      {!loadingDetail && detail && !errorDetail ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-slate-900 dark:text-slate-50 text-3xl font-black leading-tight tracking-tight">
                Đơn {String(detail.orderCode ?? orderCode)}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Đặt lúc: {formatDateTime(
                  typeof detail.createdAt === 'string' ? detail.createdAt : undefined
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${customerOrderStatusBadgeClass(os)}`}
                >
                  {customerOrderStatusLabel(os)}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${customerPaymentStatusBadgeClass(ps)}`}
                >
                  {customerPaymentStatusLabel(ps)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canResumePayOs ? (
                <PayOsResumeButton
                  accessToken={accessToken}
                  orderCode={String(detail.orderCode ?? orderCode)}
                  paymentMethod={paymentMethod}
                  onError={setPayOsError}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
                />
              ) : null}
              <button
                type="button"
                disabled={reorderBusy}
                onClick={() => void handleReorder()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Icon name="shopping_cart" className="text-lg" />
                {reorderBusy ? 'Đang thêm…' : 'Đặt lại'}
              </button>
              {canShowReturnButton ? (
                <Link
                  to={`/account/returns/create?orderCode=${encodeURIComponent(String(orderCode))}`}
                  className="px-5 py-2.5 border border-orange-400 text-orange-800 dark:border-orange-600 dark:text-orange-200 rounded-lg font-bold text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 inline-flex items-center gap-2"
                >
                  <Icon name="swap_horiz" className="text-lg" />
                  Đổi / trả hàng
                </Link>
              ) : null}
              {canShowWarrantyButton ? (
                <button
                  type="button"
                  onClick={() => {
                    setWarrantyModalKey((k) => k + 1)
                    setWarrantyOpen(true)
                  }}
                  className="px-5 py-2.5 border border-primary text-primary dark:border-primary/80 rounded-lg font-bold text-sm hover:bg-primary/5 inline-flex items-center gap-2"
                >
                  <Icon name="verified_user" className="text-lg" />
                  Yêu cầu bảo hành
                </button>
              ) : null}
              {canCancel && os !== 'Cancelled' ? (
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalKey((k) => k + 1)
                    setCancelError('')
                    setCancelOpen(true)
                  }}
                  className="px-5 py-2.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Hủy đơn
                </button>
              ) : null}
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
              Tiến độ & timeline
            </button>
          </div>

          {activeTab === 'info' ? (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 w-full space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-slate-50">Sản phẩm</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Sản phẩm</th>
                          <th className="px-4 py-2 text-right">SL</th>
                          <th className="px-4 py-2 text-right">Đơn giá</th>
                          <th className="px-4 py-2 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lines.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                              Không có dòng hàng.
                            </td>
                          </tr>
                        ) : (
                          lines.map((line, idx) => {
                            const ln = /** @type {Record<string, unknown>} */ (
                              line && typeof line === 'object' ? line : {}
                            )
                            const sku =
                              ln.skuSnapshot != null
                                ? String(ln.skuSnapshot)
                                : ln.sku != null
                                  ? String(ln.sku)
                                  : '—'
                            const variantNameRaw =
                              ln.variantName != null ? String(ln.variantName).trim() : ''
                            const productNameRaw =
                              ln.productName != null ? String(ln.productName).trim() : ''
                            const variantLabel =
                              variantNameRaw ||
                              productNameRaw ||
                              ''
                            const showProductSub =
                              variantNameRaw && productNameRaw && productNameRaw !== variantNameRaw
                            const imageAlt = variantLabel || productNameRaw || sku
                            return (
                              <tr key={ln.id != null ? String(ln.id) : `l-${idx}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <StoreLineImageThumbnail
                                      variantImageUrl={
                                        typeof ln.variantImageUrl === 'string'
                                          ? ln.variantImageUrl
                                          : undefined
                                      }
                                      productImageUrl={
                                        typeof ln.productImageUrl === 'string'
                                          ? ln.productImageUrl
                                          : undefined
                                      }
                                      alt={imageAlt}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {variantLabel || '—'}
                                      </span>
                                      {showProductSub ? (
                                        <span className="block text-xs text-slate-500 mt-0.5">
                                          {productNameRaw}
                                        </span>
                                      ) : null}
                                      <span className="block font-mono text-xs text-slate-500 mt-0.5">
                                        {sku}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">{String(ln.quantity ?? '—')}</td>
                                <td className="px-4 py-3 text-right">
                                  {formatPrice(ln.unitPrice)}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-primary">
                                  {formatPrice(ln.subTotal ?? ln.subtotal)}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[340px] shrink-0 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Icon name="location_on" className="text-primary" />
                    Giao hàng
                  </h3>
                  {shipObj ? (
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-slate-500 text-xs uppercase font-bold">Người nhận</span>
                        <br />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {String(shipObj.receiverName ?? '—')}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500 text-xs uppercase font-bold">Điện thoại</span>
                        <br />
                        {String(shipObj.receiverPhone ?? '—')}
                      </p>
                      <p>
                        <span className="text-slate-500 text-xs uppercase font-bold">Địa chỉ</span>
                        <br />
                        <span className="text-slate-800 dark:text-slate-200">
                          {String(shipObj.addressLine ?? '—')}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">—</p>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Icon name="payments" className="text-primary" />
                    Thanh toán
                  </h3>
                  <p className="text-sm">
                    Phương thức:{' '}
                    <strong>{detail.paymentMethod != null ? String(detail.paymentMethod) : '—'}</strong>
                  </p>
                  {detail.voucherCode != null && String(detail.voucherCode).trim() !== '' ? (
                    <p className="text-sm mt-2">
                      Mã ưu đãi: <strong className="text-primary">{String(detail.voucherCode)}</strong>
                    </p>
                  ) : null}
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base font-bold mb-4 text-slate-800 dark:text-slate-100">Tóm tắt</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tiền hàng</span>
                      <span>{formatPrice(detail.merchandiseSubtotal ?? detail.merchandiseTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giảm giá</span>
                      <span>{formatPrice(detail.discountAmount ?? detail.discountTotal)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-bold text-lg text-primary">
                      <span>Phải thanh toán</span>
                      <span>{formatPrice(detail.payableTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
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
                <p className="text-slate-500 text-sm">Đang tải timeline…</p>
              ) : null}
              {!loadingTimeline && !errorTimeline && sortedEvents.length === 0 ? (
                <p className="text-slate-500 text-sm">Chưa có sự kiện.</p>
              ) : null}
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                {sortedEvents.map((ev, idx) => {
                  const e = /** @type {Record<string, unknown>} */ (ev)
                  return (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
                      <p className="text-xs text-slate-500">
                        {formatDateTime(typeof e.timestamp === 'string' ? e.timestamp : undefined)}
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {String(e.eventType ?? '')} · {String(e.status ?? '')}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{String(e.description ?? '')}</p>
                      {e.notes != null && String(e.notes).trim() !== '' ? (
                        <p className="text-xs text-slate-500 mt-1">{String(e.notes)}</p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
