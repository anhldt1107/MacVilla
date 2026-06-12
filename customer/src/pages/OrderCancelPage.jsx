import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { CartStepper } from '../components/cart'
import { PayOsResumeButton } from '../components/checkout/PayOsResumeButton'
import { readCheckoutOrderFromSession } from '../lib/checkout/checkoutReturnSession'

export function OrderCancelPage() {
  const { accessToken } = useAuth()
  const { orderCode, paymentMethod } = readCheckoutOrderFromSession()
  const hasOrder = Boolean(orderCode?.trim())

  const actionBtn =
    'w-full flex justify-center items-center gap-2 rounded-xl font-bold px-6 py-3 whitespace-nowrap text-sm sm:text-base'

  return (
    <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <CartStepper currentStep={2} />
      <div className="mt-8 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 p-6 sm:p-10 text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 mb-6">
          <Icon name="payments" className="text-4xl" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Thanh toán chưa hoàn tất
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-prose mx-auto text-left sm:text-center">
          Bạn đã hủy hoặc chưa hoàn tất giao dịch trên PayOS. Đơn hàng có thể
          vẫn ở trạng thái chờ thanh toán — bạn có thể mở lại cổng thanh toán
          hoặc xem chi tiết đơn trong mục đơn hàng.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
          {hasOrder ? (
            <PayOsResumeButton
              accessToken={accessToken}
              orderCode={orderCode}
              paymentMethod={paymentMethod || 'PayOS'}
              label="Thanh toán lại PayOS"
              className={`${actionBtn} bg-primary text-white hover:bg-primary/90 disabled:opacity-60`}
            />
          ) : null}
          {hasOrder ? (
            <Link
              to={`/account/orders/${encodeURIComponent(orderCode)}`}
              className={`${actionBtn} border border-primary text-primary hover:bg-primary/5`}
            >
              Chi tiết đơn{' '}
              <span className="font-mono font-semibold">{orderCode}</span>
            </Link>
          ) : null}
          <Link
            to="/account/orders"
            className={`${actionBtn} border border-slate-300 dark:border-slate-600 font-semibold hover:bg-white/60 dark:hover:bg-slate-800`}
          >
            Đơn hàng của tôi
          </Link>
          <Link
            to="/cart"
            className={`${actionBtn} border border-slate-300 dark:border-slate-600 font-semibold hover:bg-white/60 dark:hover:bg-slate-800`}
          >
            Về giỏ hàng
          </Link>
        </div>
      </div>
    </main>
  )
}
