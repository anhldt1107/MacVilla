import { Icon } from '../../ui/Icon'
import { CartItem } from './CartItem'

export function CartItemList({
  items = [],
  onQuantityChange,
  onClearAll,
}) {
  const count = items.length
  const countLabel =
    count === 0
      ? 'Giỏ hàng của bạn'
      : count === 1
        ? 'Giỏ hàng của bạn (1 sản phẩm)'
        : `Giỏ hàng của bạn (${count} sản phẩm)`

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Icon name="shopping_bag" className="text-primary" />
          {countLabel}
        </h2>
        {count > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-slate-400 hover:text-accent-red text-sm flex items-center gap-1 transition-colors"
          >
            <Icon name="delete" className="text-sm" />
            Xóa tất cả
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          Chưa có sản phẩm nào trong giỏ hàng.
        </div>
      ) : (
        items.map((item) => (
          <CartItem
            key={item.lineId ?? item.id}
            id={item.id}
            name={item.name}
            image={item.image}
            imageAlt={item.imageAlt}
            specs={item.specs}
            quantity={item.quantity}
            price={item.price}
            originalPrice={item.originalPrice}
            discountPercent={item.discountPercent}
            onQuantityChange={onQuantityChange}
          />
        ))
      )}
    </div>
  )
}
