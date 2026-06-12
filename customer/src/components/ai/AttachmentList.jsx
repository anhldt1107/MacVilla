import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { resolveAttachmentImage, rewriteAttachmentLink } from '../../lib/ai/attachments'

/**
 * Card sản phẩm trong chat (`AI_chat_attachment.md` §2.1).
 */
function ProductCard({ attachment, namespace, onNavigate }) {
  const link = rewriteAttachmentLink(attachment, namespace)
  const img = resolveAttachmentImage(attachment.imageUrl)

  const inner = (
    <>
      {img ? (
        <img
          src={img}
          alt={attachment.title || 'Sản phẩm'}
          loading="lazy"
          className="aspect-square w-full rounded-md object-cover"
        />
      ) : (
        <div className="aspect-square w-full rounded-md bg-slate-100 flex items-center justify-center">
          <Icon name="image" className="text-3xl text-slate-300" />
        </div>
      )}
      <div className="mt-2 line-clamp-2 text-xs font-semibold text-slate-900">
        {attachment.title || '—'}
      </div>
      {attachment.subtitle ? (
        <div className="mt-0.5 line-clamp-1 text-[11px] text-[#004a99] font-medium">
          {attachment.subtitle}
        </div>
      ) : null}
    </>
  )

  const cardCls = [
    'block rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-colors',
    link ? 'hover:border-[#004a99]/40 hover:bg-[#004a99]/5 cursor-pointer' : 'opacity-90',
  ].join(' ')

  if (!link) {
    return <div className={cardCls}>{inner}</div>
  }
  return (
    <Link
      to={link}
      className={cardCls}
      onClick={() => onNavigate?.()}
    >
      {inner}
    </Link>
  )
}

/**
 * Card đơn trong chat (`AI_chat_attachment.md` §2.2).
 */
function OrderCard({ attachment, namespace, onNavigate }) {
  const link = rewriteAttachmentLink(attachment, namespace)

  const inner = (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#004a99]/10 text-[#004a99]">
        <Icon name="receipt_long" className="text-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-slate-900">
          {attachment.title || 'Đơn hàng'}
        </div>
        {attachment.subtitle ? (
          <div className="truncate text-[11px] text-slate-500">{attachment.subtitle}</div>
        ) : null}
      </div>
      {link ? (
        <Icon name="chevron_right" className="text-base text-slate-400 shrink-0" />
      ) : null}
    </div>
  )

  if (!link) {
    return <li className="block">{inner}</li>
  }
  return (
    <li>
      <Link
        to={link}
        onClick={() => onNavigate?.()}
        className="block transition-colors hover:bg-slate-50"
      >
        {inner}
      </Link>
    </li>
  )
}

/**
 * Render danh sách `attachments[]` ở dưới bubble assistant.
 *
 * @param {{
 *   attachments?: import('../../lib/ai/attachments').AiAttachment[],
 *   namespace: 'b2c' | 'b2b',
 *   onNavigate?: () => void,
 * }} props
 */
export function AttachmentList({ attachments, namespace, onNavigate }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null

  const products = attachments.filter((a) => String(a?.type || '').toLowerCase() === 'product')
  const orders = attachments.filter((a) => String(a?.type || '').toLowerCase() === 'order')

  if (products.length === 0 && orders.length === 0) return null

  return (
    <div className="mt-1 w-full max-w-full space-y-2">
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {products.map((p, idx) => (
            <ProductCard
              key={`p-${p?.meta?.productId ?? p?.meta?.slug ?? idx}-${idx}`}
              attachment={p}
              namespace={namespace}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
      {orders.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {orders.map((o, idx) => (
            <OrderCard
              key={`o-${o?.meta?.orderCode ?? idx}-${idx}`}
              attachment={o}
              namespace={namespace}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </div>
  )
}
