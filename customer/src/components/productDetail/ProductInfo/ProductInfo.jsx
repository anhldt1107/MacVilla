import { Icon } from '../../ui/Icon'
import { StoreServices } from '../StoreServices'

function formatPriceVnd(value) {
  const n = Number(value)
  if (value == null || Number.isNaN(n) || n <= 0) {
    return 'Liên hệ'
  }
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ'
}

function StarRating({ value, size = 'normal' }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  const scaleClass = size === 'small' ? 'scale-75 origin-left' : ''

  return (
    <div className={`flex text-yellow-500 ${scaleClass}`}>
      {Array.from({ length: full }, (_, i) => (
        <Icon key={`f-${i}`} name="star" className="fill-1" />
      ))}
      {half ? (
        <Icon name="star_half" />
      ) : null}
      {Array.from({ length: empty }, (_, i) => (
        <Icon key={`e-${i}`} name="star" />
      ))}
    </div>
  )
}

export function ProductInfo({
  name,
  rating = 0,
  reviewCount = 0,
  inStock,
  price,
  originalPrice,
  discountPercent,
  highlights = [],
  variants = [],
  selectedVariantId,
  onVariantChange,
  storeServicesItems = [],
  onBuyNow,
  onAddToCart,
  addToCartDisabled = false,
  /** Đang gọi API giỏ: 'add' = thêm giỏ, 'buyNow' = mua ngay sang /cart */
  cartAction = null,
  addToCartError = '',
}) {
  const hasVariants = Array.isArray(variants) && variants.length > 0
  const canPickVariant =
    variants.length > 1 && typeof onVariantChange === 'function'

  const cartBusy = Boolean(cartAction)

  const pillBase =
    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors text-left'
  const pillSelected =
    'border-primary bg-primary/10 text-primary ring-2 ring-primary/25'
  const pillIdle =
    'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-primary/50'

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
        {name}
      </h1>
      {hasVariants ? (
        <div className="mb-6">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Phân loại hàng
          </p>
          <div
            className="flex flex-wrap gap-2"
            role={canPickVariant ? 'group' : undefined}
            aria-label="Chọn biến thể"
          >
            {variants.map((v) => {
              const selected = v.id === selectedVariantId
              const stateClass = selected ? pillSelected : pillIdle
              if (canPickVariant) {
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onVariantChange(v.id)}
                    className={`${pillBase} ${stateClass}`}
                  >
                    {v.variantName}
                  </button>
                )
              }
              return (
                <span
                  key={v.id}
                  className={`${pillBase} ${pillSelected} cursor-default`}
                >
                  {v.variantName}
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center text-yellow-500">
          <StarRating value={rating} />
          <span className="ml-2 text-sm text-slate-500 font-medium">
            {reviewCount > 0
              ? `${rating} (${reviewCount} đánh giá)`
              : 'Chưa có đánh giá'}
          </span>
        </div>
        <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
        <span className="text-sm text-green-600 font-bold uppercase tracking-wider">
          {inStock ? 'Còn hàng' : 'Hết hàng'}
        </span>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-black text-primary">
            {formatPriceVnd(price)}
          </span>
          {originalPrice != null && (
            <span className="text-lg text-slate-400 line-through">
              {formatPriceVnd(originalPrice)}
            </span>
          )}
          {discountPercent != null && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/20 border border-primary/20 rounded-lg"
          >
            <Icon name={item.icon} className="text-primary" />
            <div>
              <p className="text-xs font-bold">{item.title}</p>
              <p className="text-[10px] text-slate-500">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      <StoreServices items={storeServicesItems} embedded />
      <div className="flex flex-col gap-3 mt-auto">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={
              addToCartDisabled ||
              cartBusy ||
              !onBuyNow
            }
            onClick={() => onBuyNow?.()}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none text-white font-bold py-4 rounded-xl transition-all shadow-lg flex flex-col items-center justify-center"
          >
            <span className="uppercase">
              {cartAction === 'buyNow' ? 'Đang xử lý…' : 'Mua ngay'}
            </span>
            <span className="text-[10px] font-normal opacity-80">
              Giao hàng & lắp đặt tận nhà miễn phí
            </span>
          </button>
          <button
            type="button"
            className="border-2 border-primary text-primary hover:bg-primary/5 disabled:opacity-50 disabled:pointer-events-none font-bold py-4 rounded-xl transition-all flex flex-col items-center justify-center"
            disabled={
              addToCartDisabled ||
              cartBusy ||
              !onAddToCart
            }
            onClick={() => onAddToCart?.()}
          >
            <Icon name="add_shopping_cart" />
            <span className="text-[10px] font-normal">
              {cartAction === 'add' ? 'Đang thêm…' : 'Thêm vào giỏ'}
            </span>
          </button>
        </div>
        {addToCartError.trim() ? (
          <p
            role="alert"
            className="text-sm text-center text-red-600 dark:text-red-400"
          >
            {addToCartError}
          </p>
        ) : null}
      </div>
    </div>
  )
}
