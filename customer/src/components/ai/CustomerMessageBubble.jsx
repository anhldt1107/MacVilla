import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { CustomerToolChip } from './CustomerToolChip'
import { AttachmentList } from './AttachmentList'

/**
 * Bubble user / assistant cho khách. Markdown sanitize + GFM (`ai_intergrate.md` §10.7).
 *
 * @param {{
 *   role: 'user' | 'assistant',
 *   content: string,
 *   toolsUsed?: { toolName: string, latencyMs?: number, success?: boolean }[],
 *   attachments?: import('../../lib/ai/attachments').AiAttachment[],
 *   namespace?: 'b2c' | 'b2b',
 *   onNavigate?: () => void,
 * }} props
 */
export function CustomerMessageBubble({ role, content, toolsUsed, attachments, namespace, onNavigate }) {
  const isUser = role === 'user'
  return (
    <div className={['flex w-full', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      <div
        className={[
          'flex max-w-[88%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        <div
          className={[
            'rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'rounded-br-md bg-[#004a99] text-white'
              : 'rounded-bl-md border border-slate-200 bg-white text-slate-800',
          ].join(' ')}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="ai-md max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && Array.isArray(toolsUsed) && toolsUsed.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {toolsUsed.map((t, idx) => (
              <CustomerToolChip
                key={`${t.toolName}-${idx}`}
                toolName={t.toolName}
                latencyMs={t.latencyMs}
                success={t.success}
              />
            ))}
          </div>
        ) : null}
        {!isUser && Array.isArray(attachments) && attachments.length > 0 ? (
          <AttachmentList
            attachments={attachments}
            namespace={namespace || 'b2c'}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>
    </div>
  )
}
