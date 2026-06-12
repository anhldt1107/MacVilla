import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ApiError } from '../../api/httpClient'
import * as aiStoreApi from '../../api/store/aiStoreApi'
import * as aiStoreB2bApi from '../../api/store/aiStoreB2bApi'

const LS_PREFIX = 'ai-customer:'
const PHASE_UPGRADE_MS = 2000
const REUSE_THREAD_HOURS = 24

/**
 * Hook trợ lý cho khách (B2C / B2B). Single-thread theo `ai_intergrate.md` §10.6:
 * khi mở lại app, nếu thread gần nhất < 24h → tiếp tục; ngược lại empty.
 *
 * @param {{ namespace: 'b2c' | 'b2b' }} args
 */
export function useAiCustomer({ namespace }) {
  const { user, accessToken, isAuthenticated } = useAuth()
  const api = namespace === 'b2b' ? aiStoreB2bApi : aiStoreApi
  const customerId = user?.id != null ? String(user.id) : ''
  const lsKey = customerId ? `${LS_PREFIX}${namespace}:lastThread:${customerId}` : null

  const [activeThreadId, setActiveThreadId] = useState(null)
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  const phaseTimerRef = useRef(null)

  const startPending = useCallback(() => {
    setPending(true)
    setPhase('sending')
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    phaseTimerRef.current = setTimeout(() => setPhase('loading_data'), PHASE_UPGRADE_MS)
  }, [])

  const stopPending = useCallback(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current)
      phaseTimerRef.current = null
    }
    setPending(false)
    setPhase('idle')
  }, [])

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    }
  }, [])

  const mapMessagesForRender = useCallback((rawList) => {
    if (!Array.isArray(rawList)) return []
    const out = []
    let pendingTools = []
    for (const m of rawList) {
      if (!m) continue
      const role = String(m.messageRole || '').toLowerCase()
      if (role === 'assistant' && m.toolName && !m.content) {
        pendingTools.push({ toolName: m.toolName })
        continue
      }
      if (role === 'tool') continue
      if (role === 'user' && m.content) {
        out.push({ id: m.id, role: 'user', content: String(m.content), createdAt: m.createdAt })
        pendingTools = []
        continue
      }
      if (role === 'assistant' && m.content) {
        out.push({
          id: m.id,
          role: 'assistant',
          content: String(m.content),
          createdAt: m.createdAt,
          toolsUsed: pendingTools.length ? pendingTools : undefined,
        })
        pendingTools = []
      }
    }
    return out
  }, [])

  const selectThread = useCallback(
    async (id) => {
      if (!accessToken) return
      if (id == null) {
        setActiveThreadId(null)
        setMessages([])
        return
      }
      try {
        startPending()
        setActiveThreadId(id)
        const data = await api.fetchAiThreadMessages(accessToken, id)
        setMessages(mapMessagesForRender(data))
        if (lsKey) {
          try {
            localStorage.setItem(lsKey, String(id))
          } catch {
            /* noop */
          }
        }
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Không tải được phiên chat.'
        setError(msg)
      } finally {
        stopPending()
      }
    },
    [accessToken, api, lsKey, mapMessagesForRender, startPending, stopPending]
  )

  const reset = useCallback(() => {
    setActiveThreadId(null)
    setMessages([])
    setError(null)
    if (lsKey) {
      try {
        localStorage.removeItem(lsKey)
      } catch {
        /* noop */
      }
    }
  }, [lsKey])

  const send = useCallback(
    async (raw) => {
      const message = String(raw ?? '').trim()
      if (!message || !accessToken) return
      setError(null)
      const userBubble = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userBubble])
      try {
        startPending()
        const res = await api.postAiChat(accessToken, {
          threadId: activeThreadId ?? null,
          message,
        })
        const nextThreadId = res?.threadId ?? activeThreadId ?? null
        if (nextThreadId != null && nextThreadId !== activeThreadId) {
          setActiveThreadId(nextThreadId)
          if (lsKey) {
            try {
              localStorage.setItem(lsKey, String(nextThreadId))
            } catch {
              /* noop */
            }
          }
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}-a`,
            role: 'assistant',
            content: String(res?.assistantMessage ?? ''),
            createdAt: new Date().toISOString(),
            toolsUsed: Array.isArray(res?.toolsUsed) ? res.toolsUsed : undefined,
            attachments: Array.isArray(res?.attachments) ? res.attachments : undefined,
          },
        ])
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Trợ lý đang bận, bạn thử lại trong giây lát.'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== userBubble.id))
      } finally {
        stopPending()
      }
    },
    [accessToken, activeThreadId, api, lsKey, startPending, stopPending]
  )

  const bootstrap = useCallback(async () => {
    if (!accessToken) return
    try {
      const stored = lsKey ? localStorage.getItem(lsKey) : null
      const storedId = stored ? Number(stored) : null
      const data = await api.fetchAiThreads(accessToken, { page: 1, pageSize: 1 })
      const top = Array.isArray(data?.items) ? data.items[0] : null
      if (top && (top.id === storedId || isWithinHours(top.updatedAt, REUSE_THREAD_HOURS))) {
        await selectThread(top.id)
      } else {
        setActiveThreadId(null)
        setMessages([])
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : null
      if (msg) setError(msg)
    } finally {
      setBootstrapped(true)
    }
  }, [accessToken, api, lsKey, selectThread])

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveThreadId(null)
      setMessages([])
      setBootstrapped(false)
      setError(null)
      return
    }
    if (!bootstrapped) {
      bootstrap()
    }
  }, [bootstrap, bootstrapped, isAuthenticated])

  return useMemo(
    () => ({
      messages,
      pending,
      phase,
      error,
      activeThreadId,
      bootstrapped,
      send,
      reset,
      bootstrap,
    }),
    [messages, pending, phase, error, activeThreadId, bootstrapped, send, reset, bootstrap]
  )
}

function isWithinHours(iso, hours) {
  if (!iso) return false
  try {
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return false
    return Date.now() - t <= hours * 60 * 60 * 1000
  } catch {
    return false
  }
}
