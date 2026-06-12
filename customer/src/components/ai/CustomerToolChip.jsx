import { Icon } from '../ui/Icon'
import { formatLatency, formatToolLabel } from '../../lib/ai/toolLabels'

/**
 * Chip nhỏ hiển thị tool mà Gemini gọi (`ai_intergrate.md` §10.3).
 */
export function CustomerToolChip({ toolName, latencyMs, success }) {
  const label = formatToolLabel(toolName)
  const latency = formatLatency(latencyMs)
  const errorTone = success === false
  return (
    <span
      title={toolName}
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        errorTone
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-slate-200 bg-slate-50 text-slate-600',
      ].join(' ')}
    >
      <Icon name="auto_awesome" className="text-[12px] opacity-70" />
      <span className="whitespace-nowrap">Đã xem: {label}</span>
      {latency ? <span className="opacity-70">{latency}</span> : null}
    </span>
  )
}
