import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../contexts/AuthContext'
import { CustomerAssistantDrawer } from './CustomerAssistantDrawer'

/**
 * FAB tròn góc phải-dưới mở `CustomerAssistantDrawer` (`ai_intergrate.md` §10.1).
 *
 * - `namespace="b2b"`: chỉ hiện khi user đăng nhập và `customerType === "B2B"`.
 * - `namespace="b2c"`: chỉ hiện khi user đăng nhập và `customerType !== "B2B"` (B2C / mặc định).
 *
 * @param {{ namespace: 'b2c' | 'b2b' }} props
 */
export function CustomerAssistantFab({ namespace }) {
  const { isAuthenticated, user } = useAuth()
  const [open, setOpen] = useState(false)

  if (!isAuthenticated || !user) return null
  const type = String(user.customerType || '').toUpperCase()
  if (namespace === 'b2b' && type !== 'B2B') return null
  if (namespace === 'b2c' && type === 'B2B') return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở trợ lý"
        className={[
          'fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#004a99] text-white shadow-lg ring-1 ring-[#004a99]/30 transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#004a99]/50',
          open ? 'pointer-events-none opacity-0' : '',
        ].join(' ')}
      >
        <Icon name="smart_toy" className="text-[22px]" />
      </button>
      <CustomerAssistantDrawer namespace={namespace} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
