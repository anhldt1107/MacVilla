import { useEffect, useState } from 'react'
import { Icon } from '../../ui/Icon'

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function CartItem({
  id,
  name,
  image,
  imageAlt,
  specs = [],
  quantity: initialQty,
  price,
  originalPrice,
  discountPercent,
  onQuantityChange,
}) {
  const [quantity, setQuantity] = useState(initialQty)

  useEffect(() => {
    setQuantity(initialQty)
  }, [initialQty])

  const handleDecrease = () => {
    const next = Math.max(0, quantity - 1)
    setQuantity(next)
    onQuantityChange?.(id, next)
  }
  const handleIncrease = () => {
    const next = quantity + 1
    setQuantity(next)
    onQuantityChange?.(id, next)
  }
  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10)
    if (Number.isNaN(val) || val < 0) return
    setQuantity(val)
    onQuantityChange?.(id, val)
  }

  return (
    <div className="p-4 flex gap-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
        />
      </div>
      <div className="flex-1 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 md:text-lg leading-tight">
            {name}
          </h3>
          <ul className="mt-1 space-y-1">
            {specs.map((spec, idx) => (
              <li
                key={`${idx}-${spec.text}`}
                className="text-xs text-slate-500 flex items-center gap-1"
              >
                <Icon name={spec.icon} className="text-[14px]" />
                {spec.text}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-8">
              <button
                type="button"
                onClick={handleDecrease}
                className="px-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
                aria-label="Giảm số lượng"
              >
                <Icon name="remove" className="text-sm" />
              </button>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={handleInputChange}
                className="w-10 text-center border-x border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-0 p-0 border-y-0 bg-transparent"
              />
              <button
                type="button"
                onClick={handleIncrease}
                className="px-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
                aria-label="Tăng số lượng"
              >
                <Icon name="add" className="text-sm" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onQuantityChange?.(id, 0)}
              className="text-slate-400 hover:text-accent-red text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Icon name="delete" className="text-sm" />
              Xóa
            </button>
          </div>
        </div>
        <div className="text-right flex flex-col justify-between items-end">
          <div>
            <p className="text-accent-red font-bold text-lg">
              {formatPrice(price)}
            </p>
            {originalPrice != null && (
              <p className="text-slate-400 line-through text-sm">
                {formatPrice(originalPrice)}
              </p>
            )}
            {discountPercent != null && (
              <span className="inline-block mt-1 bg-accent-red/10 text-accent-red text-[10px] font-bold px-2 py-0.5 rounded">
                Giảm {discountPercent}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
