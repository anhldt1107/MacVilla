import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { storeFetchCart } from '../api/store/storeCartApi'
import { countCartLineQuantity } from '../lib/cart/countCartLines'

const CartCountContext = createContext(null)

export function CartCountProvider({ children }) {
  const { accessToken } = useAuth()
  const [itemCount, setItemCount] = useState(0)
  const lastFocusRefreshRef = useRef(0)

  const applyCartDto = useCallback((dto) => {
    setItemCount(countCartLineQuantity(dto))
  }, [])

  const refreshCartCount = useCallback(async () => {
    if (!accessToken) {
      setItemCount(0)
      return
    }
    try {
      const data = await storeFetchCart(accessToken)
      applyCartDto(data && typeof data === 'object' ? data : null)
    } catch {
      setItemCount(0)
    }
  }, [accessToken, applyCartDto])

  useEffect(() => {
    if (!accessToken) {
      queueMicrotask(() => setItemCount(0))
      return
    }
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void (async () => {
        try {
          const data = await storeFetchCart(accessToken)
          if (!cancelled) {
            applyCartDto(data && typeof data === 'object' ? data : null)
          }
        } catch {
          if (!cancelled) queueMicrotask(() => setItemCount(0))
        }
      })()
    })
    return () => {
      cancelled = true
    }
  }, [accessToken, applyCartDto])

  useEffect(() => {
    if (!accessToken) return
    const onFocus = () => {
      const now = Date.now()
      if (now - lastFocusRefreshRef.current < 2500) return
      lastFocusRefreshRef.current = now
      void refreshCartCount()
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') onFocus()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [accessToken, refreshCartCount])

  const value = useMemo(
    () => ({
      itemCount,
      refreshCartCount,
      applyCartDto,
    }),
    [itemCount, refreshCartCount, applyCartDto]
  )

  return (
    <CartCountContext.Provider value={value}>
      {children}
    </CartCountContext.Provider>
  )
}

/** @returns {import('react').ContextType<typeof CartCountContext>} */
// eslint-disable-next-line react-refresh/only-export-components -- hook dùng cùng file với provider
export function useCartCount() {
  const ctx = useContext(CartCountContext)
  if (!ctx) {
    throw new Error('useCartCount must be used within CartCountProvider')
  }
  return ctx
}
