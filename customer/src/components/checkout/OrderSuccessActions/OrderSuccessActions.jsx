import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'

export function OrderSuccessActions() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-4">
      <Link
        to="/cart"
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <Icon name="local_shipping" />
        Theo dõi đơn hàng
      </Link>
      <Link
        to="/"
        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <Icon name="shopping_cart" />
        Tiếp tục mua sắm
      </Link>
    </div>
  )
}
