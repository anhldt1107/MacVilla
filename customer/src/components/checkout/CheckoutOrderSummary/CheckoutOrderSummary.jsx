function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

/**
 * @param {{
 *   items: Array<{ id: number, name: string, image: string, imageAlt?: string, quantity: number, price: number }>,
 *   subtotal: number,
 *   shipping: number,
 *   shippingLabel: string,
 *   couponDiscount: number,
 *   total: number,
 *   onPlaceOrder?: () => void,
 *   promoCode?: string,
 *   onPromoCodeChange?: (value: string) => void,
 *   onApplyPromo?: () => void,
 *   voucherError?: string,
 *   voucherInfo?: string,
 *   previewError?: string,
 *   previewLoading?: boolean,
 *   promoValidating?: boolean,
 *   placeOrderLoading?: boolean,
 *   placeOrderError?: string,
 *   canPlaceOrder?: boolean,
 * }}
 */
export function CheckoutOrderSummary({
  items = [],
  subtotal = 0,
  shipping: _shipping = 0,
  shippingLabel = 'Miễn phí',
  couponDiscount = 0,
  total = 0,
  onPlaceOrder,
  promoCode = '',
  onPromoCodeChange,
  onApplyPromo,
  voucherError = '',
  voucherInfo = '',
  previewError = '',
  previewLoading = false,
  promoValidating = false,
  placeOrderLoading = false,
  placeOrderError = '',
  canPlaceOrder = true,
}) {
  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
      <h2 className="text-lg font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        Tóm tắt đơn hàng
      </h2>
      {previewError ? (
        <p
          className="text-sm text-red-600 dark:text-red-400 mb-4"
          role="alert"
        >
          {previewError}
        </p>
      ) : null}
      {placeOrderError ? (
        <p
          className="text-sm text-red-600 dark:text-red-400 mb-4"
          role="alert"
        >
          {placeOrderError}
        </p>
      ) : null}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
              <img
                src={item.image}
                alt={item.imageAlt || item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold line-clamp-1 text-slate-900 dark:text-slate-100">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500">
                Số lượng: {String(item.quantity).padStart(2, '0')}
              </p>
              <p className="text-sm font-bold text-primary mt-0.5">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 font-medium">Tạm tính</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 font-medium">Phí vận chuyển</span>
          <span className="text-green-600 dark:text-green-400 font-bold">
            {shippingLabel}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 font-medium">Giảm giá</span>
          <span className="text-red-600 dark:text-red-400 font-bold">
            {couponDiscount > 0 ? `-${formatPrice(couponDiscount)}` : '0đ'}
          </span>
        </div>
        <div className="flex justify-between pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            Tổng cộng
          </span>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">
              {formatPrice(total)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
              (Đã bao gồm VAT)
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        {previewLoading || placeOrderLoading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {placeOrderLoading
              ? 'Đang tạo đơn hàng…'
              : 'Đang cập nhật giá đơn hàng…'}
          </p>
        ) : null}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Mã giảm giá"
              value={promoCode}
              onChange={(e) => onPromoCodeChange?.(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 px-3 py-2 text-slate-900 dark:text-slate-100"
              disabled={previewLoading || placeOrderLoading || promoValidating}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void onApplyPromo?.()}
              disabled={previewLoading || placeOrderLoading || promoValidating}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-sm font-bold rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Áp dụng
            </button>
          </div>
          {voucherInfo && !voucherError ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-2" role="status">
              {voucherInfo}
            </p>
          ) : null}
          {voucherError ? (
            <p
              className="text-sm text-red-600 dark:text-red-400 mt-2"
              role="alert"
            >
              {voucherError}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            const r = onPlaceOrder?.()
            if (r && typeof r.then === 'function') void r
          }}
          disabled={
            previewLoading || placeOrderLoading || !canPlaceOrder
          }
          className="w-full py-4 bg-primary text-white rounded-xl font-black text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 uppercase tracking-wide disabled:opacity-50"
        >
          {placeOrderLoading ? 'Đang xử lý…' : 'Đặt hàng ngay'}
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-4 italic">
          Bằng cách nhấn &quot;Đặt hàng ngay&quot;, bạn đồng ý với các Điều
          khoản & Chính sách của chúng tôi.
        </p>
      </div>
    </section>
  )
}
