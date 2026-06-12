function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function FrequentlyBought({ items = [], onAddToCart }) {
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">Sản phẩm thường mua kèm</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 group cursor-pointer"
          >
            <div className="aspect-square rounded-lg bg-slate-50 dark:bg-slate-800 mb-3 overflow-hidden p-2">
              <img
                src={item.image}
                alt={item.imageAlt}
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform"
              />
            </div>
            <h4 className="text-xs font-semibold line-clamp-2 h-8">
              {item.name}
            </h4>
            <p className="text-accent-red font-bold text-sm mt-2">
              {formatPrice(item.price)}
            </p>
            <button
              type="button"
              onClick={() => onAddToCart?.(item)}
              className="w-full mt-3 py-1.5 rounded-lg border border-primary text-primary text-[10px] font-bold hover:bg-primary hover:text-white transition-all"
            >
              THÊM VÀO GIỎ
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
