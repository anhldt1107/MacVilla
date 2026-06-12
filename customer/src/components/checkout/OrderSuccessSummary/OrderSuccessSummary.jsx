import { Icon } from '../../ui/Icon'

/**
 * @param {{ orderId: string, paymentMethod: string, deliveryEstimate?: string }}
 */
export function OrderSuccessSummary({
  orderId = '#MV123456',
  paymentMethod = 'PayOS',
  deliveryEstimate = '2-3 ngày làm việc',
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
      <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
        <Icon name="info" className="text-primary" />
        Chi tiết tóm tắt
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            Mã đơn hàng
          </span>
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            {orderId}
          </span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            Phương thức thanh toán
          </span>
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            {paymentMethod}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            Thời gian giao hàng dự kiến
          </span>
          <span className="font-semibold text-sm text-primary">
            {deliveryEstimate}
          </span>
        </div>
      </div>
    </div>
  )
}
