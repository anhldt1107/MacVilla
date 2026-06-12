import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../contexts/AuthContext'
import { useStoreNotifications } from '../../hooks/useStoreNotifications'

function formatRelativeTime(iso) {
  if (!iso) return ''
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} giờ`
    return `${Math.floor(hrs / 24)} ngày`
  } catch {
    return ''
  }
}

/**
 * @param {{ variant?: 'header' | 'partner' }} props
 */
export function NotificationBell({ variant = 'header' }) {
  const navigate = useNavigate()
  const { accessToken, isAuthenticated } = useAuth()
  const { unreadCount, items, listLoading, open, setOpen, markRead } = useStoreNotifications({
    accessToken,
    isAuthenticated,
  })
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, setOpen])

  if (!isAuthenticated) return null

  const isHeader = variant === 'header'
  const btnClass = isHeader
    ? 'flex flex-col items-center relative hover:opacity-90 transition-opacity'
    : 'relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'

  const handleItem = async (item) => {
    const path = String(item.deepLinkPath ?? '').trim()
    if (!item.isRead && item.id) await markRead(item.id)
    setOpen(false)
    if (path) navigate(path)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={btnClass}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="notifications" className={isHeader ? '' : 'text-xl text-slate-600 dark:text-slate-300'} />
        {isHeader ? <span className="text-[10px] font-medium">Thông báo</span> : null}
        {unreadCount > 0 ? (
          <span
            className={
              isHeader
                ? 'absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-secondary text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums'
                : 'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white'
            }
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={
            isHeader
              ? 'absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden'
              : 'absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden'
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-3 py-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thông báo</span>
          </div>
          {listLoading ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">Đang tải…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">Không có thông báo</p>
          ) : (
            <ul className="max-h-[min(60vh,320px)] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      !item.isRead ? 'bg-violet-50/80 dark:bg-violet-950/30' : ''
                    }`}
                    onClick={() => void handleItem(item)}
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    {item.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.body}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-slate-400">{formatRelativeTime(item.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
