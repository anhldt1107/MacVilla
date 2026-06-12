import { useState } from 'react'
import { Icon } from '../../ui/Icon'

export function PromoCode({ onApply }) {
  const [code, setCode] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onApply?.(code)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Icon name="confirmation_number" className="text-primary text-xl" />
        Mã giảm giá / Ưu đãi
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã giảm giá..."
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-4 focus:ring-primary h-11"
        />
        <button
          type="submit"
          className="bg-primary text-white font-bold px-6 rounded-lg text-sm hover:brightness-110 transition-all"
        >
          Áp dụng
        </button>
      </form>
    </div>
  )
}
