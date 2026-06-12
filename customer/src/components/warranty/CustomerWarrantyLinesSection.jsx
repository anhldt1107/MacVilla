import {
  customerWarrantyLineCanClaim,
  parseWarrantyTicketLines,
} from '../../lib/customerWarrantyLabels'
import { ProductLineDisplay } from '../catalog/ProductLineDisplay'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * @param {{
 *   detail: Record<string, unknown> | null
 *   onClaimLine?: (orderItemId: number) => void
 * }} props
 */
export function CustomerWarrantyLinesSection({ detail, onClaimLine }) {
  const lines = parseWarrantyTicketLines(detail)
  if (lines.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-slate-50">Sản phẩm được bảo hành</h3>
        <p className="text-xs text-slate-500 mt-1">
          Mỗi sản phẩm trên đơn có thời hạn bảo hành riêng theo chính sách nhà sản xuất.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Sản phẩm</th>
              <th className="px-4 py-2 text-center">SL</th>
              <th className="px-4 py-2 text-left">Thời hạn</th>
              <th className="px-4 py-2 text-left">Hết hạn</th>
              {onClaimLine ? <th className="px-4 py-2 text-right">Thao tác</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map((line) => {
              const canClaim = customerWarrantyLineCanClaim(line)
              const activeClaimId =
                line.activeClaimId != null && Number.isFinite(Number(line.activeClaimId))
                  ? Number(line.activeClaimId)
                  : null
              return (
                <tr key={String(line.orderItemId)}>
                  <td className="px-4 py-3">
                    <ProductLineDisplay
                      productName={line.productName}
                      variantName={line.variantName}
                      sku={line.sku}
                      imageUrl={line.imageUrl}
                      variantImageUrl={line.variantImageUrl}
                      variantId={line.variantId}
                    />
                    {activeClaimId != null ? (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        Đang xử lý yêu cầu #{activeClaimId}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{line.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{line.warrantyPeriodMonths} tháng</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>{formatDate(line.validUntil)}</div>
                    {canClaim && line.daysRemaining != null ? (
                      <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Còn {line.daysRemaining} ngày
                      </span>
                    ) : !canClaim ? (
                      <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        Hết hạn
                      </span>
                    ) : null}
                  </td>
                  {onClaimLine ? (
                    <td className="px-4 py-3 text-right">
                      {canClaim ? (
                        <button
                          type="button"
                          onClick={() => onClaimLine(line.orderItemId)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Tạo yêu cầu
                        </button>
                      ) : activeClaimId != null ? (
                        <span className="text-xs text-slate-500">Đang xử lý</span>
                      ) : (
                        <span className="text-xs text-slate-400" title={`Hết hạn từ ${formatDate(line.validUntil)}`}>
                          —
                        </span>
                      )}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
