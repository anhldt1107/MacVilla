import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'
import { useAiCustomer } from '../../lib/ai/useAiCustomer'
import { CustomerMessageBubble } from './CustomerMessageBubble'
import { CustomerSuggestedPrompts } from './CustomerSuggestedPrompts'

const HEADER_TITLE = {
  b2b: 'Trợ lý chăm sóc khách hàng',
  b2c: 'Trợ lý cửa hàng',
}

const HEADER_SUBLINE = {
  b2b: 'Phản hồi tự động · chỉ đơn & báo giá của tài khoản',
  b2c:
    'Dữ liệu catalog và chính sách đã công bố; thông số chi tiết phụ thuộc nội dung sản phẩm trong hệ thống',
}

const EMPTY_STATE_NOTICE =
  'Trợ lý dùng dữ liệu catalog và chính sách cửa hàng đã công bố; thuộc tính chi tiết khớp theo độ đầy đủ mô tả/SKU trong quản trị.'

const PLACEHOLDER = {
  b2b: 'Hỏi về đơn hàng, hóa đơn, công nợ...',
  b2c: 'Tra đơn (mã B2C...), hoặc hỏi sản phẩm, chính sách — nhập mã SKU nếu biết.',
}

/**
 * Drawer slide-in từ phải cho khách (`ai_intergrate.md` §10.1, §10.8).
 */
export function CustomerAssistantDrawer({ namespace, open, onClose }) {
  const ai = useAiCustomer({ namespace })
  const [draft, setDraft] = useState('')
  const messagesRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, ai.messages.length, ai.pending])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSend = async (text) => {
    const value = String(text ?? draft).trim()
    if (!value || ai.pending) return
    setDraft('')
    await ai.send(value)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    handleSend()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true" aria-label={HEADER_TITLE[namespace]}>
      <div className="flex-1 bg-black/40" onClick={onClose} aria-hidden />
      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:w-[420px]">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#004a99] text-white">
              <Icon name="smart_toy" className="text-[18px]" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{HEADER_TITLE[namespace]}</h2>
              <p className="text-[11px] text-slate-500">{HEADER_SUBLINE[namespace]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </header>

        <div ref={messagesRef} className="custom-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {ai.messages.length === 0 && !ai.pending ? (
            <div className="space-y-3">
              <CustomerSuggestedPrompts namespace={namespace} onPick={handleSend} disabled={ai.pending} />
              <p className="text-[11px] leading-relaxed text-slate-500">{EMPTY_STATE_NOTICE}</p>
            </div>
          ) : (
            ai.messages.map((m) => (
              <CustomerMessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                toolsUsed={m.toolsUsed}
                attachments={m.attachments}
                namespace={namespace}
                onNavigate={onClose}
              />
            ))
          )}
          {ai.pending ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
              <Icon name="autorenew" className="animate-spin text-[14px]" />
              <span>
                {ai.phase === 'loading_data' ? 'Đang lấy dữ liệu, vui lòng chờ...' : 'Đang xử lý...'}
              </span>
            </div>
          ) : null}
          {ai.error ? (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {ai.error}
            </div>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-200 p-3">
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              maxLength={4000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={PLACEHOLDER[namespace]}
              disabled={ai.pending}
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-[#004a99]/50 focus:outline-none focus:ring-2 focus:ring-[#004a99]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={ai.pending || !draft.trim()}
              title={ai.pending ? 'Đang chờ phản hồi...' : 'Gửi'}
              aria-label="Gửi"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#004a99] text-white shadow-sm transition-colors hover:bg-[#003a7a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon name={ai.pending ? 'autorenew' : 'send'} className={ai.pending ? 'animate-spin text-[18px]' : 'text-[18px]'} />
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Enter để gửi · Shift+Enter để xuống dòng · Tối đa 4000 ký tự</p>
        </form>
      </aside>
    </div>
  )
}
