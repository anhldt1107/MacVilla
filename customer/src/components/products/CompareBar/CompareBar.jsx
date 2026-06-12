import { useNavigate } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { useCompare } from '../../../contexts/CompareContext'
import { MAX_COMPARE } from '../../../lib/compare/compareShared'

const PLACEHOLDER =
  'https://placehold.co/80x80/f1f5f9/64748b/png?text=%E2%80%94'

/** @param {{ className?: string }} props */
export function CompareBar({ className = '' }) {
  const navigate = useNavigate()
  const { items, removeCompared } = useCompare()

  const count = items.length
  if (count === 0) return null

  const slots = [...items.map((item) => ({ type: /** @type {'item'} */ ('item'), item }))]
  while (slots.length < MAX_COMPARE) {
    slots.push({ type: /** @type {'empty'} */ ('empty') })
  }

  const openCompare = () => {
    const csv = items.map((i) => i.id).join(',')
    if (!csv) return
    navigate(`/compare?ids=${csv}`)
  }

  return (
    <div
      className={[
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 sm:px-6 sm:py-3',
        'bg-slate-900/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10',
        'flex items-center gap-3 sm:gap-6 max-w-[calc(100vw-1.5rem)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label="So sánh sản phẩm"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
        {slots.map((slot, index) =>
          slot.type === 'item' ? (
            <div
              key={slot.item.id}
              className="size-9 sm:size-10 rounded-lg bg-slate-800 border border-white/20 overflow-hidden relative shrink-0"
            >
              <img
                src={slot.item.image || PLACEHOLDER}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeCompared(slot.item.id)}
                className="absolute top-0 right-0 bg-red-500 text-white leading-none p-0.5 rounded-bl-md hover:bg-red-600"
                aria-label="Xóa khỏi so sánh"
              >
                <Icon name="close" className="text-[10px]" />
              </button>
            </div>
          ) : (
            <div
              key={`empty-${index}`}
              className="size-9 sm:size-10 rounded-lg bg-slate-700/50 border border-dashed border-white/10 flex items-center justify-center shrink-0"
            >
              <Icon name="add" className="text-slate-500 text-lg" />
            </div>
          )
        )}
      </div>
      <div className="h-6 sm:h-8 w-px bg-white/10 shrink-0 hidden xs:block" />
      <button
        type="button"
        onClick={openCompare}
        className="shrink-0 bg-primary text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors"
      >
        So sánh ({count}/{MAX_COMPARE})
      </button>
    </div>
  )
}
