/* eslint-disable react-refresh/only-export-components -- Provider + hooks cùng module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { MAX_COMPARE } from '../lib/compare/compareShared'

const STORAGE_KEY = 'macvilla_compare_v1'

/**
 * @typedef {{ id: number, slug?: string | null, name: string, image: string }} CompareItemSnapshot
 */

/** @returns {CompareItemSnapshot[]} */
function readStoredItems() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw || !raw.trim()) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out = []
    const seenIds = new Set()
    for (const x of parsed) {
      const id =
        x && typeof x.id === 'number' && Number.isFinite(x.id)
          ? x.id
          : Number(x?.id)
      if (!Number.isFinite(id) || id <= 0 || seenIds.has(id)) continue
      seenIds.add(id)
      const name =
        x && typeof x.name === 'string' && x.name.trim() ? x.name.trim() : 'Sản phẩm'
      const slug =
        x?.slug != null && String(x.slug).trim() ? String(x.slug).trim() : null
      const image =
        x && typeof x.image === 'string' && x.image.trim()
          ? x.image.trim()
          : ''
      out.push({
        id: Math.trunc(id),
        slug,
        name,
        image,
      })
      if (out.length >= MAX_COMPARE) break
    }
    return out
  } catch {
    return []
  }
}

/** @param {CompareItemSnapshot[]} items */
function writeStoredItems(items) {
  if (typeof window === 'undefined') return
  try {
    if (!items?.length) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore quota / privacy mode
  }
}

/**
 * @typedef {object} CompareContextValue
 * @property {CompareItemSnapshot[]} items
 * @property {(id: number) => boolean} isCompared
 * @property {(snapshot: CompareItemSnapshot) => boolean} canAdd
 * @property {(snapshot: CompareItemSnapshot, checked: boolean) => void} toggleCompared
 * @property {(id: number) => void} removeCompared
 * @property {() => void} clearCompare
 */

/** @type {React.Context<CompareContextValue | null>} */
const CompareContext = createContext(null)

export function CompareProvider({ children }) {
  const [items, setItems] = useState(
    /** @type {CompareItemSnapshot[]} */
    () => readStoredItems()
  )

  useEffect(() => {
    writeStoredItems(items)
  }, [items])

  const removeCompared = useCallback((/** @type {number} */ id) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const clearCompare = useCallback(() => {
    setItems([])
  }, [])

  const isCompared = useCallback(
    (/** @type {number} */ id) => items.some((x) => x.id === id),
    [items]
  )

  const canAdd = useCallback(
    (/** @type {CompareItemSnapshot} */ snapshot) => {
      const id =
        snapshot && typeof snapshot.id === 'number'
          ? snapshot.id
          : Number(snapshot?.id)
      if (!Number.isFinite(id) || id <= 0) return false
      if (items.some((x) => x.id === id)) return true
      return items.length < MAX_COMPARE
    },
    [items]
  )

  const toggleCompared = useCallback(
    (/** @type {CompareItemSnapshot} */ snapshot, /** @type {boolean} */ checked) => {
      const id =
        snapshot && typeof snapshot.id === 'number'
          ? snapshot.id
          : Number(snapshot?.id)
      if (!Number.isFinite(id) || id <= 0) return
      const slug =
        snapshot.slug != null && String(snapshot.slug).trim()
          ? String(snapshot.slug).trim()
          : null
      const name =
        typeof snapshot.name === 'string' && snapshot.name.trim()
          ? snapshot.name.trim()
          : 'Sản phẩm'
      const image =
        typeof snapshot.image === 'string' && snapshot.image.trim()
          ? snapshot.image.trim()
          : ''

      setItems((prev) => {
        if (!checked) {
          return prev.filter((x) => x.id !== id)
        }
        if (prev.some((x) => x.id === id)) {
          return prev.map((x) =>
            x.id === id ? { ...x, slug: slug ?? x.slug, name, image: image || x.image } : x
          )
        }
        if (prev.length >= MAX_COMPARE) return prev
        const next = [...prev, { id: Math.trunc(id), slug, name, image }]
        return next
      })
    },
    []
  )

  const value = useMemo(
    () => ({
      items,
      isCompared,
      canAdd,
      toggleCompared,
      removeCompared,
      clearCompare,
    }),
    [
      items,
      isCompared,
      canAdd,
      toggleCompared,
      removeCompared,
      clearCompare,
    ]
  )

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  )
}

/** @returns {CompareContextValue} */
export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) {
    throw new Error('useCompare must be used within CompareProvider')
  }
  return ctx
}

/**
 * Cho component (vd. PDP) không thể bọc cứng Provider trong test.
 * @returns {CompareContextValue | null}
 */
export function useCompareOptional() {
  return useContext(CompareContext)
}
