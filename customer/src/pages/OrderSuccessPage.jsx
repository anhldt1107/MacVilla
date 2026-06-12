import { useEffect, useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import {
  OrderSuccessProgress,
  OrderSuccessSummary,
  OrderSuccessActions,
  OrderSuccessYouMayLike,
  OrderSuccessSupport,
} from '../components/checkout'
import {
  clearCheckoutOrderSession,
  readCheckoutOrderFromSession,
} from '../lib/checkout/checkoutReturnSession'
import { useAuth } from '../contexts/AuthContext'
import { PayOsResumeButton } from '../components/checkout/PayOsResumeButton'

function generateOrderId() {
  return '#MV' + String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Trả về từ PayOS: ?code=00&id=...&cancel=false&status=PAID&orderCode=...
 */
function parsePayOsReturn(searchParams) {
  const has =
    searchParams.has('code') ||
    searchParams.has('status') ||
    searchParams.has('cancel')
  if (!has) return { isPayOsReturn: false, payOk: false, payCancel: false }
  const payCode = searchParams.get('code')
  const payStatus = (searchParams.get('status') || '').toUpperCase()
  const payCancel = searchParams.get('cancel') === 'true'
  const payOk =
    !payCancel &&
    payCode === '00' &&
    (payStatus === 'PAID' || payStatus === '')
  return { isPayOsReturn: true, payOk, payCancel, payCode, payStatus }
}

export function OrderSuccessPage() {
  const { accessToken } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state || {}
  const searchString = searchParams.toString()

  const pay = parsePayOsReturn(searchParams)

  const orderId = useMemo(() => {
    const fromState =
      typeof state.orderCode === 'string' && state.orderCode.trim()
        ? state.orderCode.trim()
        : ''
    const fromSession = readCheckoutOrderFromSession().orderCode
    const fromQuery =
      new URLSearchParams(searchString).get('orderCode') || ''
    const raw = fromState || fromSession || fromQuery || ''
    return raw.trim() || generateOrderId()
  }, [searchString, state.orderCode])

  const paymentMethod = useMemo(
    () =>
      (typeof state.paymentMethod === 'string' && state.paymentMethod) ||
      readCheckoutOrderFromSession().paymentMethod ||
      'PayOS',
    [state.paymentMethod]
  )

  useEffect(() => {
    if (pay.payOk) clearCheckoutOrderSession()
  }, [pay.payOk])

  const showClassicSuccess = !pay.isPayOsReturn || pay.payOk

  return (
    <main className="flex-1 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-[800px] space-y-8">
        <OrderSuccessProgress />

        <div className="text-center py-6">
          {showClassicSuccess ? (
            <>
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6 border-4 border-white dark:border-slate-800 shadow-lg">
                <Icon name="check_circle" className="text-5xl" />
              </div>
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold mb-3">
                Cảm ơn bạn đã mua hàng!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Đơn hàng{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {orderId}
                </span>{' '}
                {pay.payOk
                  ? 'đã thanh toán thành công. Chúng tôi sẽ xử lý đơn và gửi xác nhận qua email khi có cập nhật.'
                  : 'đã được đặt thành công. Chúng tôi đã gửi email xác nhận chi tiết đến địa chỉ của bạn.'}
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mb-6 border-4 border-white dark:border-slate-800 shadow-lg">
                <Icon name="schedule" className="text-5xl" />
              </div>
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold mb-3">
                Chưa xác nhận thanh toán
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                {pay.payCancel
                  ? 'Giao dịch PayOS đã được hủy hoặc chưa hoàn tất.'
                  : 'Giao dịch PayOS chưa hoàn tất hoặc đang chờ xác nhận.'}
                {pay.payCode != null ? (
                  <>
                    {' '}
                    (mã trả về:{' '}
                    <span className="font-mono font-semibold">
                      {pay.payCode}
                    </span>
                    )
                  </>
                ) : null}
                . Đơn{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {orderId}
                </span>{' '}
                có thể vẫn ở trạng thái chờ thanh toán — vui lòng kiểm tra mục
                đơn hàng hoặc thử thanh toán lại.
              </p>
              <div className="mt-6 flex flex-col gap-3 w-full max-w-md mx-auto">
                {orderId && !orderId.startsWith('#MV') ? (
                  <PayOsResumeButton
                    accessToken={accessToken}
                    orderCode={orderId}
                    paymentMethod={paymentMethod}
                    label="Thanh toán lại PayOS"
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-primary text-white font-bold px-5 py-3 hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap"
                  />
                ) : null}
                {orderId && !orderId.startsWith('#MV') ? (
                  <Link
                    to={`/account/orders/${encodeURIComponent(orderId)}`}
                    className="w-full flex justify-center items-center rounded-xl border border-primary text-primary font-bold px-5 py-3 hover:bg-primary/5 whitespace-nowrap"
                  >
                    Chi tiết đơn
                  </Link>
                ) : null}
                <Link
                  to="/account/orders"
                  className="w-full flex justify-center items-center rounded-xl border border-slate-300 dark:border-slate-600 font-semibold px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  Đơn hàng của tôi
                </Link>
                <Link
                  to="/cart"
                  className="w-full flex justify-center items-center rounded-xl border border-slate-300 dark:border-slate-600 font-semibold px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  Về giỏ hàng
                </Link>
              </div>
            </>
          )}
        </div>

        {showClassicSuccess ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OrderSuccessSummary
              orderId={orderId}
              paymentMethod={paymentMethod}
              deliveryEstimate="2-3 ngày làm việc"
            />
            <OrderSuccessActions />
          </div>
        ) : null}

        <OrderSuccessYouMayLike />
        <OrderSuccessSupport />
      </div>
    </main>
  )
}
