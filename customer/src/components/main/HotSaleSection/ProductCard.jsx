/**
 * Product card for hot sale grid
 */
function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function ProductCard({
  name,
  image,
  alt,
  price,
  originalPrice,
  discount,
  badge,
  hideOnMobile = false,
}) {
  return (
    <div
      className={`bg-white rounded-xl p-3 flex flex-col shadow-lg ${
        hideOnMobile ? 'hidden lg:flex' : ''
      }`}
    >
      <div className="relative aspect-square mb-3">
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-contain"
        />
        <span className="absolute top-0 right-0 bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
          -{discount}%
        </span>
      </div>
      <h3 className="text-xs md:text-sm font-semibold line-clamp-2 h-10 mb-2">
        {name}
      </h3>
      <div className="flex flex-col">
        <span className="text-secondary font-black text-base">
          {formatPrice(price)}
        </span>
        <span className="text-slate-400 text-[10px] line-through">
          {formatPrice(originalPrice)}
        </span>
      </div>
      <div className="mt-3 py-1.5 bg-slate-100 rounded text-[10px] text-center font-medium text-slate-600">
        {badge}
      </div>
    </div>
  )
}
