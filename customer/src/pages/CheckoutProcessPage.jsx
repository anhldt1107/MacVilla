import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CartStepper } from '../components/cart'
import { Icon } from '../components/ui/Icon'
import { storeCreatePayOsPaymentLink } from '../api/store/storePaymentsApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  persistCheckoutOrderForReturn,
  readCheckoutOrderFromSession,
} from '../lib/checkout/checkoutReturnSession'
import {
  buildPayOsCheckoutUrls,
  isPayOsPaymentMethod,
} from '../lib/checkout/payOsCheckout'

export function CheckoutProcessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const state = location.state || {}

  const sessionOrder = readCheckoutOrderFromSession()
  const orderCode =
    (typeof state.orderCode === 'string' ? state.orderCode.trim() : '') ||
    sessionOrder.orderCode
  const paymentMethod =
    (typeof state.paymentMethod === 'string' ? state.paymentMethod : '') ||
    sessionOrder.paymentMethod ||
    'PayOS'
  const payableTotal =
    typeof state.payableTotal === 'number' ? state.payableTotal : null

  const [status, setStatus] = useState(/** @type {'idle'|'loading'|'error'} */ ('idle'))
  const [error, setError] = useState('')

  const startPayOs = useCallback(async () => {
    if (!accessToken || !orderCode) return
    setStatus('loading')
    setError('')
    const { returnUrl, cancelUrl } = buildPayOsCheckoutUrls()
    try {
      persistCheckoutOrderForReturn(orderCode, paymentMethod)
      const data = await storeCreatePayOsPaymentLink(accessToken, {
        orderCode,
        returnUrl,
        cancelUrl,
      })
      const url =
        data && typeof data.checkoutUrl === 'string'
          ? data.checkoutUrl.trim()
          : ''
      if (!url) {
        setError('Không nhận được liên kết thanh toán từ máy chủ.')
        setStatus('error')
        return
      }
      window.location.assign(url)
    } catch (e) {
      setError(getApiErrorMessage(e))
      setStatus('error')
    }
  }, [accessToken, orderCode, paymentMethod])

  useEffect(() => {
    if (!accessToken) {
      navigate('/login', {
        state: { from: `${location.pathname}${location.search}` },
        replace: true,
      })
      return
    }
    if (!orderCode) {
      navigate('/account/orders', { replace: true })
      return
    }
    if (!isPayOsPaymentMethod(paymentMethod)) {
      navigate('/checkout/success', {
        replace: true,
        state: {
          orderCode,
          paymentMethod,
          payableTotal,
        },
      })
      return
    }
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void startPayOs()
    })
    return () => {
      cancelled = true
    }
  }, [
    accessToken,
    orderCode,
    paymentMethod,
    payableTotal,
    navigate,
    location.pathname,
    location.search,
    startPayOs,
  ])

  if (!accessToken) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-600 dark:text-slate-400 text-sm">
        Đang chuyển đến đăng nhập…
      </main>
    )
  }

  if (!orderCode) {
    return null
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10 sm:py-16">
      <CartStepper currentStep={2} />
      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center shadow-sm">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary mb-6">
          {status === 'error' ? (
            <Icon name="error" className="text-4xl" />
          ) : (
            <Icon name="payments" className="text-4xl animate-pulse" />
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {status === 'error'
            ? 'Không mở được cổng thanh toán'
            : 'Đang chuyển đến PayOS'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
          Mã đơn:{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {orderCode}
          </span>
        </p>
        {payableTotal != null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Số tiền thanh toán:{' '}
            <span className="font-semibold text-primary">
              {new Intl.NumberFormat('vi-VN').format(payableTotal)}đ
            </span>
          </p>
        ) : (
          <div className="mb-6" />
        )}
        {status === 'loading' ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Vui lòng đợi trong giây lát. Trình duyệt sẽ mở trang thanh toán PayOS.
          </p>
        ) : null}
        {status === 'error' && error ? (
          <p
            className="text-sm text-red-600 dark:text-red-400 mb-6"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {status === 'loading' ? (
          <Link
            to={`/account/orders/${encodeURIComponent(orderCode)}`}
            className="text-xs font-semibold text-primary hover:underline mb-4 inline-block"
          >
            Mở lại PayOS từ chi tiết đơn
          </Link>
        ) : null}
        {status === 'error' ? (
          <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
            <button
              type="button"
              onClick={() => void startPayOs()}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-primary text-white font-bold px-6 py-3 hover:bg-primary/90 whitespace-nowrap"
            >
              <Icon name="refresh" className="text-xl" />
              Thử lại
            </button>
            <Link
              to={`/account/orders/${encodeURIComponent(orderCode)}`}
              className="w-full flex justify-center items-center rounded-xl border border-primary text-primary font-bold px-6 py-3 hover:bg-primary/5 whitespace-nowrap"
            >
              Chi tiết đơn
            </Link>
            <Link
              to="/account/orders"
              className="w-full flex justify-center items-center rounded-xl border border-slate-300 dark:border-slate-600 font-semibold px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Đơn hàng của tôi
            </Link>
          </div>
        ) : null}
        {status === 'loading' ? (
          <div className="flex justify-center gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2 rounded-full bg-primary/40 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
