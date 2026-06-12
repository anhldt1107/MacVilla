export function OrderSuccessProgress() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col gap-3">
        <div className="flex gap-6 justify-between items-center">
          <p className="text-slate-900 dark:text-white text-base font-semibold">
            Tiến trình đơn hàng
          </p>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
            Hoàn tất
          </span>
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100 dark:bg-slate-800">
            <div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Giỏ hàng</span>
          <span>Thông tin</span>
          <span>Thanh toán</span>
          <span className="text-primary font-bold">Thành công</span>
        </div>
      </div>
    </div>
  )
}
