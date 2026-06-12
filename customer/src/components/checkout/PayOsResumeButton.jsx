import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { getApiErrorMessage } from '../../lib/errors/apiErrorMessage'
import { resumePayOsCheckout } from '../../lib/checkout/payOsCheckout'

/**
 * @param {{
 *   accessToken: string | null
 *   orderCode: string
 *   paymentMethod?: string
 *   className?: string
 *   label?: string
 *   busyLabel?: string
 *   onError?: (message: string) => void
 * }} props
 */
export function PayOsResumeButton({
  accessToken,
  orderCode,
  paymentMethod = 'PayOS',
  className = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-bold px-5 py-2.5 hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap shrink-0',
  label = 'Thanh toán PayOS',
  busyLabel = 'Đang mở PayOS…',
  onError,
}) {
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    if (!accessToken || busy) return
    setBusy(true)
    try {
      await resumePayOsCheckout(accessToken, orderCode, paymentMethod)
    } catch (e) {
      const msg = getApiErrorMessage(e)
      onError?.(msg)
      setBusy(false)
    }
  }

  const showText = Boolean(label || busyLabel)

  return (
    <button
      type="button"
      disabled={!accessToken || busy}
      onClick={() => void handleClick()}
      className={className}
      title={showText ? undefined : label || 'Thanh toán PayOS'}
    >
      <Icon name={busy ? 'hourglass_empty' : 'payments'} className="text-lg" />
      {showText ? (busy ? busyLabel || label : label) : null}
    </button>
  )
}
