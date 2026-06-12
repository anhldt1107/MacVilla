import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { navigateToProductSearch } from '../../../lib/catalog/navigateToProductSearch'

const PLACEHOLDER = 'Bạn cần tìm thiết bị gì?'

export function SearchBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [value, setValue] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      if (location.pathname === '/products') {
        setValue(searchParams.get('search') || '')
      } else {
        setValue('')
      }
    })
  }, [location.pathname, searchParams])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      navigateToProductSearch(navigate, location, value)
    },
    [value, location, navigate]
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden md:flex flex-1 max-w-2xl bg-white rounded-lg items-center px-3 py-1.5 gap-2"
      role="search"
    >
      <button
        type="submit"
        className="p-0.5 rounded text-slate-400 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shrink-0"
        aria-label="Tìm kiếm"
      >
        <Icon name="search" className="text-[1.25rem] pointer-events-none" />
      </button>
      <input
        type="search"
        name="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border-none focus:ring-0 text-slate-800 text-sm bg-transparent"
        placeholder={PLACEHOLDER}
        aria-label={PLACEHOLDER}
        autoComplete="off"
      />
    </form>
  )
}

/** Thanh tìm trên mobile: nút mở sheet + overlay. */
export function HeaderMobileSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      if (location.pathname === '/products') {
        setValue(searchParams.get('search') || '')
      } else {
        setValue('')
      }
    })
  }, [location.pathname, searchParams])

  const runSearch = useCallback(() => {
    navigateToProductSearch(navigate, location, value)
    setOpen(false)
  }, [navigate, location, value])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      runSearch()
    },
    [runSearch]
  )

  return (
    <>
      <button
        type="button"
        className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
        aria-label="Mở tìm kiếm"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="search" className="text-[1.35rem]" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Đóng tìm kiếm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 shadow-lg border-b border-slate-200 dark:border-slate-700 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <input
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={PLACEHOLDER}
                aria-label={PLACEHOLDER}
                autoComplete="off"
                autoFocus
                className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Tìm
              </button>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                onClick={() => setOpen(false)}
              >
                Huỷ
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
