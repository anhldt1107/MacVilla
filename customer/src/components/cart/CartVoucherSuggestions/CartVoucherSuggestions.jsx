import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../ui/Icon'
import { storeFetchCartVouchers } from '../../../api/store/storeCartApi'
import { getApiErrorMessage } from '../../../lib/errors/apiErrorMessage'
import {
  cartVoucherDiscountRuleLabel,
  formatVnd,
} from '../../../lib/cartVoucherDisplay'

const SCROLL_ROW =
  'flex gap-2 overflow-x-auto pb-1.5 pt-0.5 -mx-1 px-1 snap-x snap-mandatory custom-scrollbar'

/**
 * Gợi ý mã theo giỏ. Ở thanh toán, bấm **Dùng** gọi `onApplyCode`.
 *
 * @param {{
 *   accessToken: string | null
 *   isB2c: boolean
 *   cartDependency: unknown
 *   onApplyCode: (code: string) => void
 *   applyLoading?: boolean
 * }} props
 */
export function CartVoucherSuggestions({
  accessToken,
  isB2c,
  cartDependency,
  onApplyCode,
  applyLoading = false,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(
    /** @type {{ merchandiseSubtotal?: number, items?: unknown[] } | null} */ (null)
  )

  const load = useCallback(async () => {
    if (!accessToken || !isB2c) {
      setPayload(null)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await storeFetchCartVouchers(accessToken)
      setPayload(data && typeof data === 'object' ? data : null)
    } catch (e) {
      setPayload(null)
      setError(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [accessToken, isB2c])

  useEffect(() => {
    void load()
  }, [load, cartDependency])

  const rows = useMemo(() => {
    const items = Array.isArray(payload?.items) ? payload.items : []
    return items.map((r) =>
      r && typeof r === 'object' ? /** @type {Record<string, unknown>} */ (r) : {}
    )
  }, [payload])

  const flatCards = useMemo(() => {
    const applicable = []
    const needMore = []
    const inactive = []
    for (const r of rows) {
      const eligible = r.eligible === true
      const app = r.applicableToCart === true
      if (app) applicable.push(r)
      else if (eligible) needMore.push(r)
      else inactive.push(r)
    }
    /** @type {{ row: Record<string, unknown>, variant: 'ok' | 'warn' | 'muted' }[]} */
    const out = []
    for (const row of applicable) out.push({ row, variant: 'ok' })
    for (const row of needMore) out.push({ row, variant: 'warn' })
    for (const row of inactive) out.push({ row, variant: 'muted' })
    return out
  }, [rows])

  const subtotalRef =
    typeof payload?.merchandiseSubtotal === 'number'
      ? payload.merchandiseSubtotal
      : null

  if (!accessToken || !isB2c) return null

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-primary/[0.06] to-transparent dark:from-primary/10 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name="sell" className="text-primary text-lg shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Mã ưu đãi gợi ý
            </h3>
            {subtotalRef != null && Number.isFinite(subtotalRef) ? (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tạm tính:{' '}
                <strong className="text-slate-700 dark:text-slate-300 tabular-nums">
                  {formatVnd(subtotalRef)}
                </strong>
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0 text-[11px] font-bold text-primary hover:underline disabled:opacity-50"
        >
          {loading ? 'Đang tải…' : 'Làm mới'}
        </button>
      </div>

      <div className="px-2 py-2">
        {loading && rows.length === 0 && !error ? (
          <div className={`${SCROLL_ROW} animate-pulse`}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-w-[200px] max-w-[220px] shrink-0 snap-start h-12 rounded-lg bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-2 py-1.5" role="status">
            {error}
          </p>
        ) : null}

        {!loading && !error && flatCards.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
            Chưa có mã phù hợp.
          </p>
        ) : null}

        {!loading && !error && flatCards.length > 0 ? (
          <div className={SCROLL_ROW}>
            {flatCards.map(({ row, variant }, idx) => (
              <VoucherCard
                key={row.voucherId != null ? String(row.voucherId) : `v-${idx}`}
                row={row}
                variant={variant}
                onApplyCode={onApplyCode}
                applyLoading={applyLoading}
              />
            ))}
          </div>
        ) : null}
      </div>

      <p className="px-3 py-1.5 text-[9px] text-slate-500 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-700/80 leading-snug">
        Bấm <strong className="text-slate-600 dark:text-slate-400">Dùng</strong> để áp dụng mã vào đơn (đã kiểm tra với giỏ hiện tại).
      </p>
    </div>
  )
}

/**
 * @param {{
 *   row: Record<string, unknown>
 *   variant: 'ok' | 'warn' | 'muted'
 *   onApplyCode: (code: string) => void
 *   applyLoading?: boolean
 * }} props
 */
function VoucherCard({ row, variant, onApplyCode, applyLoading }) {
  const code = row.code != null ? String(row.code) : '—'
  const campaign =
    row.campaignName != null && String(row.campaignName).trim() !== ''
      ? String(row.campaignName)
      : null
  const rule = cartVoucherDiscountRuleLabel(row)
  const minV =
    typeof row.minOrderValue === 'number' && Number.isFinite(row.minOrderValue)
      ? row.minOrderValue
      : null
  const disc =
    typeof row.discountAmount === 'number' && Number.isFinite(row.discountAmount)
      ? row.discountAmount
      : null
  const msg =
    typeof row.message === 'string' && row.message.trim() !== ''
      ? row.message.trim()
      : null

  const canApply = variant === 'ok'
  const muted = variant === 'muted'

  const accent =
    variant === 'ok'
      ? 'border-emerald-400/90 dark:border-emerald-600'
      : variant === 'warn'
        ? 'border-amber-400/80 dark:border-amber-700'
        : 'border-slate-300 dark:border-slate-600'

  const bg =
    variant === 'ok'
      ? 'bg-white/95 dark:bg-slate-900/60'
      : variant === 'warn'
        ? 'bg-amber-50/70 dark:bg-slate-900/50'
        : 'bg-slate-50/90 dark:bg-slate-900/45'

  const titleHint = [campaign, msg].filter(Boolean).join(' — ') || undefined

  return (
    <article
      title={titleHint}
      className={`min-w-[200px] max-w-[220px] w-[58vw] sm:w-52 shrink-0 snap-start rounded-lg border ${accent} ${bg} pl-2 pr-1.5 py-1 flex items-start gap-2 shadow-sm ${muted ? 'opacity-85' : ''}`}
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="font-mono font-bold text-xs text-primary leading-tight truncate">
          {code}
        </p>
        <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight line-clamp-2 mt-0.5">
          <span className="font-medium">{rule}</span>
          {minV != null && minV > 0 ? (
            <span className="text-slate-500 dark:text-slate-400"> · Min {formatVnd(minV)}</span>
          ) : null}
          {disc != null && disc > 0 && variant === 'ok' ? (
            <span className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">
              {' '}
              · −{formatVnd(disc)}
            </span>
          ) : null}
        </p>
      </div>
      <div className="shrink-0 flex flex-row items-center gap-1 justify-end">
        {variant === 'ok' ? (
          <span className="text-[9px] font-bold uppercase px-1 py-px rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 leading-none whitespace-nowrap">
            Được
          </span>
        ) : null}
        {variant === 'warn' ? (
          <span className="text-[9px] font-bold uppercase px-1 py-px rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 leading-none whitespace-nowrap">
            Thiếu
          </span>
        ) : null}
        {variant === 'muted' ? (
          <span className="text-[9px] font-bold uppercase px-1 py-px rounded bg-slate-200/90 dark:bg-slate-700 text-slate-600 dark:text-slate-300 leading-none whitespace-nowrap">
            —
          </span>
        ) : null}
        {canApply ? (
          <button
            type="button"
            disabled={applyLoading}
            onClick={() => onApplyCode(code)}
            className="inline-flex items-center gap-0 text-[10px] font-bold text-primary hover:underline disabled:opacity-50 disabled:cursor-wait leading-none whitespace-nowrap"
          >
            Dùng
            <Icon name="chevron_right" className="text-sm" />
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-0 text-[10px] font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed select-none leading-none whitespace-nowrap"
            aria-disabled="true"
            title={
              variant === 'warn'
                ? 'Thêm giá trị đơn để dùng mã khi thanh toán'
                : 'Mã không khả dụng với giỏ hiện tại'
            }
          >
            Dùng
            <Icon name="chevron_right" className="text-sm opacity-40" />
          </span>
        )}
      </div>
    </article>
  )
}
