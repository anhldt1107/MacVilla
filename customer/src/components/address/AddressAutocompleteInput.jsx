import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchGoongAutocomplete } from '../../api/store/goongAutocompleteApi'

/** @type {string | null} */
let sessionLocationCache = null
let sessionLocationRequested = false

function tryResolveSessionLocation() {
  if (sessionLocationRequested) return Promise.resolve(sessionLocationCache)
  sessionLocationRequested = true
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sessionLocationCache = `${pos.coords.latitude},${pos.coords.longitude}`
        resolve(sessionLocationCache)
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 }
    )
  })
}

/**
 * Ô nhập địa chỉ có gợi ý Goong (degrade thành input/textarea thường khi API không khả dụng).
 */
export function AddressAutocompleteInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'Số nhà, đường, phường, quận, tỉnh/thành…',
  id: idProp,
  rows = 3,
  className = '',
  onSelect,
  maxLength = 2000,
}) {
  const autoId = useId()
  const inputId = idProp ?? autoId
  const listboxId = `${inputId}-suggestions`

  const wrapperRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const anchorRef = useRef(/** @type {HTMLTextAreaElement | HTMLInputElement | null} */ (null))
  const debounceRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))
  const requestIdRef = useRef(0)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState(/** @type {import('../../api/store/goongAutocompleteApi').GoongAutocompletePrediction[]} */ ([]))
  const [activeIndex, setActiveIndex] = useState(-1)
  const [locationBias, setLocationBias] = useState(/** @type {string | null} */ (null))
  const [dropdownRect, setDropdownRect] = useState(/** @type {{ top: number, left: number, width: number } | null} */ (null))

  useEffect(() => {
    void tryResolveSessionLocation().then((loc) => {
      if (loc) setLocationBias(loc)
    })
  }, [])

  const updateDropdownRect = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  const runSearch = useCallback(
    async (query) => {
      const q = String(query ?? '').trim()
      if (q.length < 3) {
        setPredictions([])
        setOpen(false)
        setActiveIndex(-1)
        return
      }

      const reqId = ++requestIdRef.current
      setLoading(true)
      try {
        const items = await fetchGoongAutocomplete({
          input: q,
          location: locationBias ?? undefined,
          limit: 6,
        })
        if (reqId !== requestIdRef.current) return
        setPredictions(items)
        setOpen(items.length > 0)
        setActiveIndex(items.length > 0 ? 0 : -1)
        if (items.length > 0) {
          requestAnimationFrame(() => updateDropdownRect())
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false)
      }
    },
    [locationBias, updateDropdownRect]
  )

  const scheduleSearch = useCallback(
    (query) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void runSearch(query)
      }, 300)
    },
    [runSearch]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open || predictions.length === 0) {
      setDropdownRect(null)
      return
    }
    updateDropdownRect()
    const onReposition = () => updateDropdownRect()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, predictions.length, updateDropdownRect])

  const selectPrediction = useCallback(
    (prediction) => {
      onChange(prediction.description)
      onSelect?.(prediction)
      setOpen(false)
      setPredictions([])
      setActiveIndex(-1)
    },
    [onChange, onSelect]
  )

  const handleChange = (e) => {
    const next = e.target.value
    onChange(next)
    scheduleSearch(next)
  }

  const handleKeyDown = (e) => {
    if (!open || predictions.length === 0) {
      if (e.key === 'Escape') setOpen(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % predictions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? predictions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < predictions.length) {
        e.preventDefault()
        selectPrediction(predictions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  useEffect(() => {
    const onDocClick = (ev) => {
      const target = /** @type {Node} */ (ev.target)
      if (wrapperRef.current?.contains(target)) return
      const list = document.getElementById(listboxId)
      if (list?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [listboxId])

  const inputClass =
    className ||
    'w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 p-3 text-slate-900 dark:text-slate-100'

  const multiline = rows > 1
  const showDropdown = open && predictions.length > 0 && dropdownRect != null

  const dropdown =
    showDropdown && typeof document !== 'undefined'
      ? createPortal(
          <div
            id={listboxId}
            role="listbox"
            aria-label="Gợi ý địa chỉ"
            className="fixed z-[200] overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-[0_16px_40px_-8px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/50 dark:ring-white/10"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              maxHeight: `min(16rem, calc(100vh - ${dropdownRect.top}px - 12px))`,
            }}
          >
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              Chọn địa chỉ
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {predictions.map((p, idx) => (
                <li
                  key={p.placeId || `${p.description}-${idx}`}
                  id={`${inputId}-opt-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`cursor-pointer border-l-[3px] px-3 py-3 text-left transition-colors ${
                    idx === activeIndex
                      ? 'border-l-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectPrediction(p)
                  }}
                >
                  <span className="block text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">
                    {p.mainText || p.description}
                  </span>
                  {p.secondaryText ? (
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {p.secondaryText}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )
      : null

  return (
    <div ref={wrapperRef} className="relative">
      {multiline ? (
        <textarea
          ref={anchorRef}
          id={inputId}
          rows={rows}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setOpen(true)
              updateDropdownRect()
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`${inputClass} resize-y min-h-[5rem] ${loading ? 'pr-20' : ''}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${inputId}-opt-${activeIndex}` : undefined
          }
        />
      ) : (
        <input
          ref={anchorRef}
          id={inputId}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setOpen(true)
              updateDropdownRect()
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`${inputClass} ${loading ? 'pr-20' : ''}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${inputId}-opt-${activeIndex}` : undefined
          }
        />
      )}

      {loading ? (
        <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-medium text-primary dark:bg-slate-900/90">
          Đang tìm…
        </span>
      ) : null}

      {dropdown}
    </div>
  )
}
