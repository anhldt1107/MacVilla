import { useEffect, useId, useState } from 'react'

const PREVIEW_MAX_ROWS = 5

function SpecRows({ items, withBottomBorder = true }) {
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div
          key={`${index}-${item.label}`}
          className={`flex justify-between gap-3 py-2 ${
            withBottomBorder && index < items.length - 1
              ? 'border-b border-slate-100 dark:border-slate-800'
              : ''
          }`}
        >
          <span className="text-sm text-slate-500 shrink-0 min-w-0">
            {item.label}
          </span>
          <span className="text-sm font-medium text-right min-w-0 break-words">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TechnicalSpecs({ items = [] }) {
  const [open, setOpen] = useState(false)
  const dialogTitleId = useId()

  const preview = items.slice(0, PREVIEW_MAX_ROWS)
  const hasMore = items.length > PREVIEW_MAX_ROWS

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!items.length) {
    return (
      <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Thông số kỹ thuật</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chưa có thông số cho sản phẩm này.
        </p>
      </section>
    )
  }

  return (
    <>
      <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm min-w-0">
        <h3 className="text-lg font-bold mb-4">Thông số kỹ thuật</h3>
        <SpecRows items={preview} />
        {hasMore ? (
          <button
            type="button"
            className="w-full mt-4 py-2 text-primary font-bold text-sm border border-primary/20 rounded-lg hover:bg-primary/5"
            onClick={() => setOpen(true)}
          >
            Xem tất cả thông số
          </button>
        ) : null}
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 dark:bg-black/60"
            aria-label="Đóng"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="relative z-10 flex max-h-[min(85vh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 id={dialogTitleId} className="text-lg font-bold">
                Thông số kỹ thuật
              </h3>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng"
                onClick={() => setOpen(false)}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  ×
                </span>
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-4 py-3">
              <SpecRows items={items} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
