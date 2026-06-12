import { StoreLineImageThumbnail } from '../catalog/StoreLineImageThumbnail'
import { extractReturnSideFields, formatProductLineTitle } from '../../lib/productLineDisplay'

/** @param {import('../../lib/productLineDisplay').extractReturnSideFields extends (...args: infer _) => infer R ? R : never} fields */
function ReturnSideCell({ fields, emptyLabel = '—' }) {
  const title = formatProductLineTitle(fields)
  if (title === '—') return <span className="text-slate-400">{emptyLabel}</span>

  const showProductSub =
    fields.productName &&
    fields.variantName &&
    String(fields.productName).trim() &&
    String(fields.variantName).trim() &&
    String(fields.productName) !== String(fields.variantName)

  return (
    <div className="flex min-w-0 items-start gap-3">
      <StoreLineImageThumbnail
        variantImageUrl={typeof fields.imageUrl === 'string' ? fields.imageUrl : undefined}
        alt={title}
        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 object-cover"
      />
      <div className="min-w-0">
        <span className="font-medium text-slate-900 dark:text-slate-100">{title}</span>
        {showProductSub ? (
          <span className="block text-xs text-slate-500 mt-0.5">{String(fields.productName)}</span>
        ) : null}
        {fields.sku ? (
          <span className="block font-mono text-xs text-slate-500 mt-0.5">{String(fields.sku)}</span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * @param {{ items: unknown[] }} props
 */
export function ReturnItemsTable({ items }) {
  if (!items.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2 text-left">Hàng trả</th>
            <th className="px-4 py-2 text-left">Đổi sang</th>
            <th className="px-4 py-2 text-right">SL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((it, idx) => {
            const row = it && typeof it === 'object' ? /** @type {Record<string, unknown>} */ (it) : {}
            const returned = extractReturnSideFields(row, 'returned')
            const exchanged = extractReturnSideFields(row, 'exchanged')
            const qty = row.quantity
            const hasExchange =
              exchanged.productName ||
              exchanged.variantName ||
              exchanged.sku ||
              exchanged.variantId != null

            return (
              <tr key={row.id != null ? String(row.id) : `it-${idx}`}>
                <td className="px-4 py-3 align-top">
                  <ReturnSideCell fields={returned} />
                </td>
                <td className="px-4 py-3 align-top">
                  {hasExchange ? <ReturnSideCell fields={exchanged} /> : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right align-top tabular-nums">
                  {qty != null ? String(qty) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
