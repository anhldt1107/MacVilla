import { Link } from 'react-router-dom'
import { ORDER_SUCCESS_YOU_MAY_LIKE } from '../../../data/checkout'

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function OrderSuccessYouMayLike() {
  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Có thể bạn quan tâm
        </h2>
        <Link
          to="/products"
          className="text-primary text-sm font-semibold hover:underline"
        >
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ORDER_SUCCESS_YOU_MAY_LIKE.map((item) => (
          <Link
            key={item.id}
            to={`/products/${item.id}`}
            className="group block"
          >
            <div className="aspect-square rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden mb-3">
              <img
                src={item.image}
                alt={item.imageAlt || item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
              {item.name}
            </h4>
            <p className="text-primary font-bold text-sm mt-0.5">
              {formatPrice(item.price)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
